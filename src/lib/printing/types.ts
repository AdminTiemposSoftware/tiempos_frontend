export interface TicketPrintNumber {
    number: string;
    amount: number;
    amount_name?: string | null;
}

export interface TicketPrintData {
    serial?: string;
    ticket_number?: string;
    upperLines: string[];
    numbers: TicketPrintNumber[];
    total: number;
    footerLines: string[];
}

export type Receipt = TicketPrintData;
