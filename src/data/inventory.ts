export type FoodItem = {
    id: number;
    name: string;
    quantity: number;
}

const inventory: FoodItem[] = [];

export function getInventory(): FoodItem[] {
    return inventory;
}

export function getLastId(): number  {
    return inventory.length;
}

export function addFood(item: FoodItem): void {
    inventory.push(item);
}

export function removeFood(id: number): void {
    const index = inventory.findIndex(item => item.id === id);

    if (index !== -1) {
        inventory.splice(index, 1);
    }
}