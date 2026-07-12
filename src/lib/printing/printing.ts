import qz from 'qz-tray';
import { escpos } from './escpos';
import type { ReceiptData, Receipt } from './types';

let printerName = 'EPSON TM-T88V';

let config: qz.configs.Config | null = null;

export async function connect(name = printerName) {
    printerName = name;

    if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
    }

    config = qz.configs.create(printerName);
}

export async function reconnect() {
    if (qz.websocket.isActive()) {
        return;
    }

    await connect(printerName);
}

export async function disconnect() {
    if (qz.websocket.isActive()) {
        await qz.websocket.disconnect();
    }
}

async function send(data: any[]) {
    await reconnect();

    if (!config) {
        throw new Error('Printer not connected.');
    }

    await qz.print(config, data);
}

export async function printReceipt(receipt: ReceiptData) {

    const output: any[] = [];

    output.push(escpos.initialize);

    if (receipt.title) {

        output.push(escpos.alignCenter);
        output.push(escpos.boldOn);
        output.push(escpos.doubleSizeOn);

        output.push(escpos.text(receipt.title));

        output.push(escpos.normalSize);
        output.push(escpos.boldOff);
    }

    output.push(escpos.alignLeft);

    for (const line of receipt.lines) {

        const left = line.left.padEnd(24);

        output.push(
            escpos.text(left + (line.right ?? ''))
        );
    }

    if (receipt.footer) {

        output.push(escpos.feed());

        output.push(escpos.alignCenter);
        output.push(escpos.text(receipt.footer));
    }

    output.push(escpos.feed(3));
    output.push(escpos.cut);

    await send(output);
}

export async function printQRCode(text: string) {

    await send([
        escpos.alignCenter,
        escpos.qr(text),
        escpos.feed(2),
        escpos.cut
    ]);
}

export async function printBarcode(text: string) {

    await send([
        escpos.alignCenter,
        ...escpos.barcode(text),
        escpos.feed(2),
        escpos.cut
    ]);
}

export async function openCashDrawer() {

    await send([
        escpos.drawer
    ]);
}

export async function cutPaper() {

    await send([
        escpos.cut
    ]);
}

function buildReceipt(ticket: Ticket): Receipt {
    return {
        title: "Lotería Nacional",

        subtitles: ["Sucursal Central"],

        items: ticket.details.map(d => ({
            number: d.number,
            amount: d.amount
        })),

        total: ticket.total,

        qr: ticket.id,

        footer: ["¡Buena suerte!"]
    };
}