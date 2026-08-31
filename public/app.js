const addFoodButton = document.getElementById("add-food");
const removeFoodButton = document.getElementById("remove-food");
import {FoodItem, addFood, removeFood, getInventory, getLastId} from "../src/data/inventory";
let FoodID = getLastId();

addFoodButton.addEventListener("click", () => {
    window.location.href = "addFood.html";
    console.log("Add food pressed");
    food = {
      id: FoodID
    }
    addFood(food);
})

removeFoodButton.addEventListener("click", () => {
    window.location.href = "removeFood.html";
    console.log("Remove food pressed");
})
document.getElementById("shutdown").addEventListener("click", async () => {
  if (!confirm("Shut down Project Freeze?")) return;

  await fetch("/api/system/shutdown", {
    method: "POST"
  });
});

document.getElementById("reboot").addEventListener("click", async () => {
  if (!confirm("Restart Project Freeze?")) return;

  await fetch("/api/system/reboot", {
    method: "POST"
  });
});