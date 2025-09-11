export interface Company {
    id: number;
    userId: number; // ID of the owner/supplier
    name: string;
    address: string;
    phone: string;
    email: string;
    description?: string;
    logoUrl?: string;
    logoBase64?: string;
}
