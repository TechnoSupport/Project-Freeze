import express from "express";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.static(path.join(process.cwd(), "public")));
app.listen(PORT, () => {
  console.log(`Project Freeze UI running at http://localhost:${PORT}`)
})

import {
  startPump,
  stopPump,
  getPumpStatus
} from "./hardware/pump";

import {
  readTemperature
} from "./hardware/temperature";

import {
  getInventory,
  addFood
} from "./data/inventory";
import { shutdownPi, rebootPi } from "./hardware/system";

app.post("/api/system/shutdown", (req, res) => {
  res.json({ message: "Shutting down..." });

  setTimeout(() => {
    shutdownPi();
  }, 1000);
});

app.post("/api/system/reboot", (req, res) => {
  res.json({ message: "Rebooting..." });

  setTimeout(() => {
    rebootPi();
  }, 1000);
});

async function main() {
  console.log("Space Freezer starting...");

  const temperature = await readTemperature();

  console.log(`Temperature: ${temperature}°C`);
  console.log(`Pump running: ${getPumpStatus()}`);

  addFood({
    id: 1,
    name: "Test Meal",
    quantity: 1
  });

  console.log(getInventory());
}



main();