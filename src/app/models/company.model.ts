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
    companyName: string;
    managerName: string;
    dpi: string;
    nit: string;
    tradeName: string;
    businessActivity?: string;
    legalName: string;
    whatsapp: string;
    facebook?: string;
    youtube?: string;
    instagram?: string;
    x?: string;
    tiktok?: string;
    bank: string;
    accountType: string;
    accountNumber: string;
}
