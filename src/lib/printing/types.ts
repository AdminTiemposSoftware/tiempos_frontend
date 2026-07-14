export interface ReceiptLine {
    left: string;
    right?: string;
}

export interface ReceiptData {
    title?: string;
    lines: ReceiptLine[];
    footer?: string;
}

export interface Receipt {
    title: string;
    serial?: string;
    subtitles?: string[];
    items: {
        number: string;
        amount: number;
    }[];
    total: number;
    qr?: string;
    footer?: string[];
}