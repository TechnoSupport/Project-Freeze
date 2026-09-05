const addFoodButton =
  document.getElementById("add-food");

const removeFoodButton =
  document.getElementById("remove-food");

const shutdownButton =
  document.getElementById("shutdown");

const rebootButton =
  document.getElementById("reboot");

const settingsButton =
  document.getElementById("settings-button");

const closeSystemModalButton =
  document.getElementById("close-system-modal");

const systemModal =
  document.getElementById("system-modal");

const temperatureElement =
  document.getElementById("temperature-value");

const pumpPowerElement =
  document.getElementById("pump-power");

const pumpStateElement =
  document.getElementById("pump-state");

const pumpDescriptionElement =
  document.getElementById("pump-description");

const pumpPowerBar =
  document.getElementById("pump-power-bar");

const inventoryElement =
  document.getElementById("inventory");

const inventoryCountElement =
  document.getElementById("inventory-count");


/* -------------------------
   NAVIGATION
------------------------- */

addFoodButton.addEventListener("click", () => {
  window.location.href = "addFood.html";
});

removeFoodButton.addEventListener("click", () => {
  window.location.href = "removeFood.html";
});


/* -------------------------
   SYSTEM MENU
------------------------- */

settingsButton.addEventListener("click", () => {
  systemModal.classList.remove("hidden");
});

closeSystemModalButton.addEventListener("click", () => {
  systemModal.classList.add("hidden");
});

systemModal.addEventListener("click", (event) => {
  if (event.target === systemModal) {
    systemModal.classList.add("hidden");
  }
});


/* -------------------------
   PI SYSTEM COMMANDS
------------------------- */

shutdownButton.addEventListener("click", async () => {

  const confirmed = confirm(
    "Shut down Project Freeze?"
  );

  if (!confirmed) {
    return;
  }

  try {

    await fetch("/api/system/shutdown", {
      method: "POST"
    });

    shutdownButton.textContent =
      "Shutting Down...";

  } catch (error) {

    console.error(
      "Failed to shut down Raspberry Pi:",
      error
    );

  }

});


rebootButton.addEventListener("click", async () => {

  const confirmed = confirm(
    "Restart Project Freeze?"
  );

  if (!confirmed) {
    return;
  }

  try {

    await fetch("/api/system/reboot", {
      method: "POST"
    });

    rebootButton.textContent =
      "Restarting...";

  } catch (error) {

    console.error(
      "Failed to restart Raspberry Pi:",
      error
    );

  }

});


/* -------------------------
   UI UPDATE FUNCTIONS
------------------------- */

function updateTemperature(temperature) {

  const numericTemperature =
    Number(temperature);

  if (!Number.isFinite(numericTemperature)) {
    temperatureElement.textContent = "--.-";
    return;
  }

  temperatureElement.textContent =
    numericTemperature.toFixed(1);

}


function updatePump(power) {

  let numericPower =
    Number(power);

  if (!Number.isFinite(numericPower)) {
    numericPower = 0;
  }

  numericPower =
    Math.max(
      0,
      Math.min(100, numericPower)
    );

  pumpPowerElement.textContent =
    Math.round(numericPower);

  pumpPowerBar.style.width =
    `${numericPower}%`;

  if (numericPower > 0) {

    pumpStateElement.textContent =
      "RUNNING";

    pumpStateElement.classList.remove(
      "off"
    );

    pumpStateElement.classList.add(
      "on"
    );

    pumpDescriptionElement.textContent =
      `PWM output at ${Math.round(numericPower)}%`;

  } else {

    pumpStateElement.textContent =
      "OFF";

    pumpStateElement.classList.remove(
      "on"
    );

    pumpStateElement.classList.add(
      "off"
    );

    pumpDescriptionElement.textContent =
      "Pump stopped";

  }

}


function updateInventory(items) {

  if (!Array.isArray(items)) {
    return;
  }

  inventoryElement.innerHTML = "";

  inventoryCountElement.textContent =
    items.length;

  if (items.length === 0) {

    inventoryElement.innerHTML = `
      <div class="empty-state">

        <p>No food has been added yet.</p>

        <span>
          Add an item to begin tracking freezer contents.
        </span>

      </div>
    `;

    return;
  }

  for (const item of items) {

    const row =
      document.createElement("div");

    row.className =
      "inventory-item";


    const name =
      document.createElement("div");

    name.className =
      "inventory-name";

    name.textContent =
      item.name || "Unnamed Item";


    const quantity =
      document.createElement("div");

    quantity.className =
      "inventory-quantity";

    quantity.textContent =
      `Quantity: ${item.quantity ?? 1}`;


    row.appendChild(name);
    row.appendChild(quantity);

    inventoryElement.appendChild(row);

  }

}


/* -------------------------
   TEMPORARY PROTOTYPE DATA
-------------------------

These values allow the new UI to work
before we create the live status API.

Delete this section once
/api/status is implemented.
*/

updateTemperature(-20);

updatePump(0);


/* -------------------------
   LIVE STATUS
-------------------------

Once the backend endpoint exists,
this function will automatically
populate the dashboard.

Expected JSON:

{
  "temperature": -18.4,
  "pumpPower": 42,
  "inventory": [...]
}
*/

async function refreshStatus() {

  try {

    const response =
      await fetch("/api/status");

    if (!response.ok) {
      return;
    }

    const data =
      await response.json();


    if (
      data.temperature !== undefined
    ) {
      updateTemperature(
        data.temperature
      );
    }


    if (
      data.pumpPower !== undefined
    ) {
      updatePump(
        data.pumpPower
      );
    }


    if (
      Array.isArray(data.inventory)
    ) {
      updateInventory(
        data.inventory
      );
    }

  } catch (error) {

    /*
      During early development this
      endpoint does not exist yet,
      so don't spam the console.
    */

  }

}


/* Refresh freezer data once per second */

refreshStatus();

setInterval(
  refreshStatus,
  1000
);