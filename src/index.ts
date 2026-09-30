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
  addFood
} from "./data/inventory";

import {
  shutdownPi,
  rebootPi
} from "./hardware/system";


const app = express();
const PORT = 3000;

app.use(express.json());

app.use(
  express.static(
    path.join(process.cwd(), "public")
  )
);


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

app.post("/api/system/shutdown", (req, res) => {
  res.json({
    message: "Shutting down..."
  });

  setTimeout(() => {
    shutdownPi();
  }, 1000);
});


app.post("/api/system/reboot", (req, res) => {
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

app.listen(PORT, () => {
  console.log(
    `Project Freeze UI running at http://localhost:${PORT}`
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

  addFood({
    id: 1,
    name: "Test Meal",
    quantity: 1
  });

  console.log(getInventory());
}


main();