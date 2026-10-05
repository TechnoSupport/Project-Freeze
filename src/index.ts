import express from "express";
import path from "path";

import {
  setPumpSpeed,
  getPumpSpeed,
  stopPump
} from "./hardware/pump";

import {
  readTemperature
} from "./hardware/temperature";

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

app.use(express.json());

app.use(
  express.static(
    path.join(process.cwd(), "public")
  )
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/inventory", (_req, res) => {
  res.json({ inventory: getInventory() });
});

app.get("/api/status", async (_req, res) => {
  const [temperatureResult, pumpResult] = await Promise.allSettled([
    readTemperature(),
    getPumpSpeed()
  ]);

  res.json({
    temperature: temperatureResult.status === "fulfilled" ? temperatureResult.value : null,
    pumpPower: pumpResult.status === "fulfilled" ? pumpResult.value : null,
    inventory: getInventory(),
    hardware: {
      temperature: temperatureResult.status === "fulfilled" ? "ok" : "error",
      pump: pumpResult.status === "fulfilled" ? "ok" : "error"
    }
  });
});

app.post("/api/inventory", (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const quantity = Number(req.body.quantity);

  if (!name || !Number.isInteger(quantity) || quantity < 1) {
    res.status(400).json({ error: "Name and a positive whole-number quantity are required" });
    return;
  }

  const item = { id: getLastId() + 1, name, quantity };
  addFood(item);
  res.status(201).json(item);
});

app.delete("/api/inventory/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid item ID" });
    return;
  }
  removeFood(id);
  res.status(204).send();
});


// -------------------------
// Temperature
// -------------------------

app.get("/api/temperature", async (req, res) => {
  try {
    const temperature = await readTemperature();

    res.json({
      temperature
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to read temperature"
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
      speed < 0 ||
      speed > 100
    ) {
      res.status(400).json({
        error: "Speed must be between 0 and 100"
      });

      return;
    }

    const newSpeed = await setPumpSpeed(speed);

    res.json({
      speed: newSpeed
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to set pump speed"
    });
  }
});


app.get("/api/pump/speed", async (req, res) => {
  try {
    const speed = await getPumpSpeed();

    res.json({
      speed
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to get pump speed"
    });
  }
});


app.post("/api/pump/stop", async (req, res) => {
  try {
    await stopPump();

    res.json({
      speed: 0,
      message: "Pump stopped"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to stop pump"
    });
  }
});


// -------------------------
// System
// -------------------------

function requireLocalRequest(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const address = req.socket.remoteAddress || "";
  if (address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1") {
    next();
    return;
  }
  res.status(403).json({ error: "Power controls are available only on the Pi display" });
}

app.post("/api/system/shutdown", requireLocalRequest, (req, res) => {
  res.json({
    message: "Shutting down..."
  });

  setTimeout(() => {
    shutdownPi();
  }, 1000);
});


app.post("/api/system/reboot", requireLocalRequest, (req, res) => {
  res.json({
    message: "Rebooting..."
  });

  setTimeout(() => {
    rebootPi();
  }, 1000);
});


// -------------------------
// Server
// -------------------------

app.listen(PORT, HOST, () => {
  console.log(
    `Project Freeze UI running at http://${HOST}:${PORT}`
  );
});


async function main() {
  console.log("Space Freezer starting...");

  try {
    const temperature = await readTemperature();

    console.log(
      `Temperature: ${temperature}°C`
    );

    const pumpSpeed = await getPumpSpeed();

    console.log(
      `Pump speed: ${pumpSpeed}%`
    )

  } catch (error) {
    console.error(
      "Hardware startup error:",
      error
    );
  }

  console.log(`Inventory items: ${getInventory().length}`);
}


main();
