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