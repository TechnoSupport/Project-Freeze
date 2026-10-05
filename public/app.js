function byId(id) {
  return document.getElementById(id);
}

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

function updateTemperature(value) {
  const element = byId("temperature-value");
  if (!element) return;
  const temperature = Number(value);
  element.textContent = Number.isFinite(temperature) ? temperature.toFixed(1) : "--.-";
}

function updatePump(value) {
  const power = Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Number(value))) : 0;
  if (byId("pump-power")) byId("pump-power").textContent = Math.round(power);
  if (byId("pump-power-bar")) byId("pump-power-bar").style.width = `${power}%`;
  if (!byId("pump-state")) return;

  byId("pump-state").textContent = power > 0 ? "RUNNING" : "OFF";
  byId("pump-state").classList.toggle("on", power > 0);
  byId("pump-state").classList.toggle("off", power === 0);
  byId("pump-description").textContent = power > 0 ? `PWM output at ${Math.round(power)}%` : "Pump stopped";
}

function renderInventory(items, removable = false) {
  const container = byId("inventory");
  if (!container || !Array.isArray(items)) return;
  if (byId("inventory-count")) byId("inventory-count").textContent = items.length;
  container.replaceChildren();

  if (!items.length) {
    container.innerHTML = '<div class="empty-state"><p>No food has been added yet.</p><span>Add an item to begin tracking freezer contents.</span></div>';
    return;
  }

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "inventory-item";
    const details = document.createElement("div");
    details.innerHTML = '<div class="inventory-name"></div><div class="inventory-quantity"></div>';
    details.querySelector(".inventory-name").textContent = item.name || "Unnamed Item";
    details.querySelector(".inventory-quantity").textContent = `Quantity: ${item.quantity}`;
    row.appendChild(details);

    if (removable) {
      const button = document.createElement("button");
      button.className = "danger-button compact-button";
      button.textContent = "Remove";
      button.addEventListener("click", async () => {
        await request(`/api/inventory/${item.id}`, { method: "DELETE" });
        await loadInventory(true);
      });
      row.appendChild(button);
    }
    container.appendChild(row);
  }
}

async function loadInventory(removable = false) {
  const data = await request("/api/inventory");
  renderInventory(data.inventory, removable);
}

async function refreshStatus() {
  try {
    const data = await request("/api/status");
    updateTemperature(data.temperature);
    updatePump(data.pumpPower);
    renderInventory(data.inventory);
    const healthy = data.hardware.temperature === "ok" && data.hardware.pump === "ok";
    if (byId("system-status")) byId("system-status").textContent = healthy ? "SYSTEM READY" : "CHECK HARDWARE";
  } catch (_error) {
    if (byId("system-status")) byId("system-status").textContent = "CONNECTION LOST";
  }
}

byId("add-food")?.addEventListener("click", () => { window.location.href = "addFood.html"; });
byId("remove-food")?.addEventListener("click", () => { window.location.href = "removeFood.html"; });
byId("Back")?.addEventListener("click", () => { window.location.href = "/"; });

byId("settings-button")?.addEventListener("click", () => byId("system-modal").classList.remove("hidden"));
byId("close-system-modal")?.addEventListener("click", () => byId("system-modal").classList.add("hidden"));
byId("system-modal")?.addEventListener("click", event => {
  if (event.target === byId("system-modal")) byId("system-modal").classList.add("hidden");
});

async function powerAction(action, message) {
  if (!confirm(message)) return;
  await request(`/api/system/${action}`, { method: "POST" });
}
byId("shutdown")?.addEventListener("click", () => powerAction("shutdown", "Shut down Project Freeze?"));
byId("reboot")?.addEventListener("click", () => powerAction("reboot", "Restart Project Freeze?"));

byId("add-food-form")?.addEventListener("submit", async event => {
  event.preventDefault();
  const message = byId("form-message");
  try {
    await request("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: byId("food-name").value, quantity: Number(byId("food-quantity").value) })
    });
    window.location.href = "/";
  } catch (error) {
    message.textContent = error.message;
  }
});

if (byId("temperature-value")) {
  refreshStatus();
  setInterval(refreshStatus, 10000);
} else if (byId("remove-page")) {
  loadInventory(true).catch(error => { byId("form-message").textContent = error.message; });
}
