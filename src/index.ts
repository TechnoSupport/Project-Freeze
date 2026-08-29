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