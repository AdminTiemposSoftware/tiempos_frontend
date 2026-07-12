const ESC = '\x1B';
const GS = '\x1D';

export const escpos = {
    initialize: ESC + '@',

    alignLeft: ESC + 'a' + '\x00',
    alignCenter: ESC + 'a' + '\x01',
    alignRight: ESC + 'a' + '\x02',

    boldOn: ESC + 'E' + '\x01',
    boldOff: ESC + 'E' + '\x00',

    doubleSizeOn: GS + '!' + '\x11',
    normalSize: GS + '!' + '\x00',

    cut: GS + 'V' + '\x00',

    drawer: ESC + 'p' + '\x00\x32\x32',

    feed(lines = 1) {
        return ESC + 'd' + String.fromCharCode(lines);
    },

    text(text: string) {
        return text + '\n';
    },

    qr(data: string) {
        return {
            type: 'raw',
            format: 'command',
            flavor: 'plain',
            data:
                '\x1D(k\x04\x001A2\x00' +
                '\x1D(k\x03\x001C\x08' +
                '\x1D(k' +
                String.fromCharCode((data.length + 3) & 0xff) +
                String.fromCharCode((data.length + 3) >> 8) +
                '1P0' +
                data +
                '\x1D(k\x03\x001Q0'
        };
    },

    barcode(data: string) {
        return [
            GS + 'h' + '\x50',
            GS + 'w' + '\x02',
            GS + 'k' + '\x49' + String.fromCharCode(data.length) + data
        ];
    }
};