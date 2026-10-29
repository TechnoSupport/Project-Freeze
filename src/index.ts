import express from "express";
import path from "path";

import {
  setPumpSpeed,
  getPumpSpeed,
  stopPump,
  getPumpMode
} from "./hardware/pump";

import {
  readTemperature
} from "./hardware/temperature";

import {
  calculatePumpOutput
} from "./hardware/pumpController";

import {
  getInventory,
  getLastId,
  addFood,
  removeFood
} from "./data/inventory";

import {
  shutdownPi,
  rebootPi
} from "./hardware/system";


const app = express();

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

const LOOP_INTERVAL_MS = 10_000;

let controlCycleRunning = false;
let controlTimer: NodeJS.Timeout | undefined;
let shuttingDown = false;


app.use(express.json());

app.use(
  express.static(
    path.join(process.cwd(), "public")
  )
);


// -------------------------
// Automatic pump control
// -------------------------

async function runAutomaticControlCycle(): Promise<void> {
  if (controlCycleRunning || shuttingDown) {
    return;
  }

  controlCycleRunning = true;

  try {
    const temperature = await readTemperature();
    const currentOutput = await getPumpSpeed();

    const nextOutput = calculatePumpOutput(
      temperature,
      currentOutput
    );

    if (shuttingDown) {
      return;
    }

    if (nextOutput !== currentOutput) {
      await setPumpSpeed(nextOutput);
    }

    console.log(
      `Automatic control: ${temperature}°C → ${nextOutput}%`
    );
  } catch (error) {
    console.error(
      "Automatic control error:",
      error
    );

    try {
      await stopPump();
    } catch (stopError) {
      console.error(
        "Emergency pump stop failed:",
        stopError
      );
    }
  } finally {
    controlCycleRunning = false;
  }
}


function startAutomaticPumpControl(): void {
  if (process.env.AUTO_CONTROL_ENABLED !== "true") {
    console.log(
      "Automatic pump control disabled"
    );

    return;
  }

  if (
    getPumpMode() === "hardware" &&
    process.env.ALLOW_HARDWARE_AUTO_CONTROL !== "true"
  ) {
    console.error(
      "Hardware automation requires " +
      "ALLOW_HARDWARE_AUTO_CONTROL=true"
    );

    return;
  }

  console.log(
    `Automatic pump control enabled in ${getPumpMode()} mode`
  );

  void runAutomaticControlCycle();

  controlTimer = setInterval(() => {
    void runAutomaticControlCycle();
  }, LOOP_INTERVAL_MS);
}


async function shutdownController(): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (controlTimer) {
    clearInterval(controlTimer);
  }

  try {
    await stopPump();

    console.log(
      "Pump stopped"
    );
  } catch (error) {
    console.error(
      "Failed to stop pump:",
      error
    );
  }

  process.exit(0);
}


process.once("SIGINT", () => {
  void shutdownController();
});


process.once("SIGTERM", () => {
  void shutdownController();
});


// -------------------------
// Health
// -------------------------

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    pumpMode: getPumpMode(),
    automaticControl:
      process.env.AUTO_CONTROL_ENABLED === "true"
  });
});


// -------------------------
// Status
// -------------------------

app.get("/api/status", async (_req, res) => {
  const [
    temperatureResult,
    pumpResult
  ] = await Promise.allSettled([
    readTemperature(),
    getPumpSpeed()
  ]);

  res.json({
    temperature:
      temperatureResult.status === "fulfilled"
        ? temperatureResult.value
        : null,

    pumpPower:
      pumpResult.status === "fulfilled"
        ? pumpResult.value
        : null,

    pumpMode: getPumpMode(),

    automaticControl:
      process.env.AUTO_CONTROL_ENABLED === "true",

    inventory: getInventory(),

    hardware: {
      temperature:
        temperatureResult.status === "fulfilled"
          ? "ok"
          : "error",

      pump:
        pumpResult.status === "fulfilled"
          ? "ok"
          : "error"
    }
  });
});


// -------------------------
// Inventory
// -------------------------

app.get("/api/inventory", (_req, res) => {
  res.json({
    inventory: getInventory()
  });
});


app.post("/api/inventory", (req, res) => {
  const name =
    typeof req.body.name === "string"
      ? req.body.name.trim()
      : "";

  const quantity = Number(
    req.body.quantity
  );

  if (
    !name ||
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    res.status(400).json({
      error:
        "Name and a positive whole-number quantity are required"
    });

    return;
  }

  const item = {
    id: getLastId() + 1,
    name,
    quantity
  };

  addFood(item);

  res.status(201).json(item);
});


app.delete("/api/inventory/:id", (req, res) => {
  const id = Number(
    req.params.id
  );

  if (!Number.isInteger(id)) {
    res.status(400).json({
      error: "Invalid item ID"
    });

    return;
  }

  removeFood(id);

  res.status(204).send();
});


// -------------------------
// Temperature
// -------------------------

app.get("/api/temperature", async (_req, res) => {
  try {
    const temperature =
      await readTemperature();

    res.json({
      temperature
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Failed to read temperature"
    });
  }
});


// -------------------------
// Pump
// -------------------------

app.post("/api/pump/speed", async (req, res) => {
  try {
    const { speed } = req.body;

    if (
      typeof speed !== "number" ||
      !Number.isFinite(speed) ||
      speed < 0 ||
      speed > 100
    ) {
      res.status(400).json({
        error:
          "Speed must be between 0 and 100"
      });

      return;
    }

    const newSpeed =
      await setPumpSpeed(speed);

    res.json({
      speed: newSpeed
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Failed to set pump speed"
    });
  }
});


app.get("/api/pump/speed", async (_req, res) => {
  try {
    const speed =
      await getPumpSpeed();

    res.json({
      speed
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Failed to get pump speed"
    });
  }
});


app.post("/api/pump/stop", async (_req, res) => {
  try {
    await stopPump();

    res.json({
      speed: 0,
      message: "Pump stopped"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Failed to stop pump"
    });
  }
});


// -------------------------
// System
// -------------------------

function requireLocalRequest(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const address =
    req.socket.remoteAddress || "";

  if (
    address === "127.0.0.1" ||
    address === "::1" ||
    address === "::ffff:127.0.0.1"
  ) {
    next();
    return;
  }

  res.status(403).json({
    error:
      "Power controls are available only on the Pi display"
  });
}


app.post(
  "/api/system/shutdown",
  requireLocalRequest,
  (_req, res) => {
    res.json({
      message: "Shutting down..."
    });

    setTimeout(() => {
      shutdownPi();
    }, 1000);
  }
);


app.post(
  "/api/system/reboot",
  requireLocalRequest,
  (_req, res) => {
    res.json({
      message: "Rebooting..."
    });

    setTimeout(() => {
      rebootPi();
    }, 1000);
  }
);


// -------------------------
// Server
// -------------------------

app.listen(PORT, HOST, () => {
  console.log(
    `Project Freeze UI running at http://${HOST}:${PORT}`
  );
});


async function main(): Promise<void> {
  console.log(
    "Space Freezer starting..."
  );

  try {
    const temperature =
      await readTemperature();

    console.log(
      `Temperature: ${temperature}°C`
    );

    const pumpSpeed =
      await getPumpSpeed();

    console.log(
      `Pump output: ${pumpSpeed}%`
    );

    startAutomaticPumpControl();
  } catch (error) {
    console.error(
      "Hardware startup error:",
      error
    );
  }

  console.log(
    `Inventory items: ${getInventory().length}`
  );
}


void main();