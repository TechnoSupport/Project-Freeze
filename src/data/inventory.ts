import fs from "fs";
import path from "path";

export type FoodItem = { id: number; name: string; quantity: number };

const dataFile = process.env.INVENTORY_FILE || path.resolve(process.cwd(), "data/inventory.json");

function loadInventory(): FoodItem[] {
    try {
        return JSON.parse(fs.readFileSync(dataFile, "utf8"));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") console.error("Inventory load failed:", error);
        return [];
    }
}

const inventory: FoodItem[] = loadInventory();

function saveInventory(): void {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    const temporaryFile = `${dataFile}.tmp`;
    fs.writeFileSync(temporaryFile, JSON.stringify(inventory, null, 2));
    fs.renameSync(temporaryFile, dataFile);
}

export function getInventory(): FoodItem[] {
    return inventory;
}

export function getLastId(): number  {
    return inventory.reduce((highest, item) => Math.max(highest, item.id), 0);
}

export function addFood(item: FoodItem): void {
    inventory.push(item);
    saveInventory();
}

export function removeFood(id: number): void {
    const index = inventory.findIndex(item => item.id === id);

    if (index !== -1) {
        inventory.splice(index, 1);
        saveInventory();
    }
}
