export interface InventoryMovement {
    id: number;
    productId: number;
    type: 'entry' | 'exit'; // 'entry' for stock increase, 'exit' for stock decrease
    quantity: number;
    date: string; // ISO string format
    userId: number; // User who performed the movement
    notes?: string;
}
