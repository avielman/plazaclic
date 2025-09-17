export interface Brand {
    id: number;
    name: string;
    logoUrl?: string;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    code: string;
    quantity: number;
    imageUrl: string[];
    brand: Brand;
    category: string[];
    model: string;
    ownerId?: number;
    imageSrc?: string; // Added to hold the processed image source
}
