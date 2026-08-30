const addFoodButton = document.getElementById("add-food");
const removeFoodButton = document.getElementById("remove-food");

addFoodButton.addEventListener("click", () => {
    console.log("Add food pressed");
})

removeFoodButton.addEventListener("click", () => {
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