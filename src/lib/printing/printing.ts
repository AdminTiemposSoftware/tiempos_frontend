export function serializeData(data: Record<string, number>, ticket_serial: string): string {
    const serialHex = ticket_serial
        ? BigInt(ticket_serial).toString(16).toUpperCase()
        : '';
    const count = Object.keys(data).length;

    if (count >= 20) return '';
    return Object.entries(data)
        .sort(([leftNumber], [rightNumber]) => Number(leftNumber) - Number(rightNumber))
        .map(([number, item]) => {
            const numberHex = Number(number).toString(16).toUpperCase().padStart(2, '0');
            const priceHex = Number(item).toString(16).toUpperCase().padStart(6, '0');

            return `${numberHex}${priceHex}`;
        })
        .join('') + serialHex;
}

export function formatAmount(value: number) {
    if (!Number.isFinite(value)) {
        return "0";
    }

    const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
    const [integerPart, decimalPart] = Math.abs(rounded).toFixed(2).split(".");
    const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const sign = rounded < 0 ? "-" : "";

    return decimalPart === "00"
        ? `${sign}${groupedInteger}`
        : `${sign}${groupedInteger},${decimalPart}`;
}

export function serializeListQrData(data: Record<number, number>): string {
    return Object.entries(data)
        .filter(([, value]) => Number.isFinite(value))
        .sort(([left], [right]) => Number(left) - Number(right))
        .map(([number, price]) => {
            const numberHex = Number(number).toString(16).toUpperCase().padStart(2, '0');
            const priceHex = Number(price).toString(16).toUpperCase().padStart(6, '0');
            return `${numberHex}${priceHex}`;
        })
        .join('');
}

export function decodeListQrData(qrData: string): Record<number, number> {
    const normalized = qrData.trim().toUpperCase();

    if (!normalized || /[^0-9A-F]/.test(normalized)) {
        return {};
    }

    const decoded: Record<number, number> = {};

    for (let index = 0; index + 8 <= normalized.length; index += 8) {
        const chunk = normalized.slice(index, index + 8);
        const number = Number.parseInt(chunk.slice(0, 2), 16);
        const price = Number.parseInt(chunk.slice(2), 16);

        if (Number.isNaN(number) || Number.isNaN(price) || number < 0 || number > 99) {
            continue;
        }

        decoded[number] = price;
    }

    return decoded;
}
