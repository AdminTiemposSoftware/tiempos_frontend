<script lang="ts">
    import { goto } from '$app/navigation';
    import Matrix from "$lib/components/venta/Matrix.svelte";
    import Sell from "$lib/components/venta/Sell.svelte";
    import SellHeader from "$lib/components/venta/SellHeader.svelte";
    import { prohibitedNumbers } from "../../../lib/stores/UpdateSellMatrix";
    import { sellingMatrix } from "../../../lib/stores/UpdateSellMatrix";
    import { auth } from "$lib/stores/auth";
    import { total } from "../../../lib/stores/UpdateSellMatrix";
    import { jsPDF } from 'jspdf';

    let { data } = $props();
    
    type TicketSold = { number: string; price: number };

    type AvailableBet = {
        draw_schedule_branch_id: number;
        comission: string | number;
        schedule_id: number;
        schedule_name: string;
        schedule_time: string;
        draw_id: number;
        draw_name: string;
        draw_is_reventado: boolean;
        draw_is_megareventado: boolean;
        draw_day_id: number;
        day_name: string;
    };

    type NumberTotal = {
        id: number;
        number: number;
        amount: string | number;
        is_reventado: boolean;
        is_megareventado: boolean;
    };

    type ProhibitedNumber = {
        id: number;
        number: number;
        amount: string | number;
        starter: string | number;
        can_sell_after_amount: boolean;
        by_amount: boolean;
        by_percentage: boolean;
    };

    type TicketHeader = {
        id: number;
        serial: string;
        amount: string | number;
        time: string;
        date: string;
        detail: string | null;
        enabled: boolean;
    };

    type Numbers = {
        ticket_header_serial: string;
        number: number;
        amount: string | number;
        is_reventado: boolean;
        is_megareventado: boolean;
    };

    type TicketRow = {
        id: number;
        total: number;
        details: string;
        status?: boolean;
        date?: string;
        serial?: string;
        time?: string;
    };

    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
    let selectedDate = $state(utcMinus6Date.toISOString().split('T')[0]);
    let selectedBet = $state<AvailableBet | null>(null);
    let prohibitedPercentage = $state();
    let availableBets = $state<AvailableBet[]>([]);
    let isMatrixLoading = $state(false);
    let tickets = $state<TicketRow[]>([]);
    let ticketNumbers = $state<Numbers[]>([]);
    let now = $state(new Date());

    function formatCloseTime(scheduleTime: string) {
        return scheduleTime.slice(0, 5);
    }

    $effect(() => {
        now;
        const items = Array.isArray(data?.drawItems) ? (data.drawItems as AvailableBet[]) : [];
        const mappedBets = items.map((item) => ({
            draw_schedule_branch_id: item.draw_schedule_branch_id,
            comission: item.comission,
            schedule_id: item.schedule_id,
            schedule_name: item.schedule_name,
            schedule_time: formatCloseTime(item.schedule_time),
            draw_id: item.draw_id,
            draw_name: item.draw_name,
            draw_is_reventado: item.draw_is_reventado,
            draw_is_megareventado: item.draw_is_megareventado,
            draw_day_id: item.draw_day_id,
            day_name: item.day_name
        }));

        
        const filteredBets = mappedBets.filter((bet) =>
            isBetOpen(bet.schedule_time, now)
        );

        availableBets = filteredBets;

        const selectedScheduleId =
            selectedBet?.schedule_id ??
            Number(data?.selectedScheduleId ?? null);
            
        const nextSelectedBet =
            filteredBets.find(
                (bet) => bet.schedule_id === selectedScheduleId
            ) ??
            filteredBets[0] ??
            null;

        if (selectedBet?.schedule_id !== nextSelectedBet?.schedule_id) {
            selectedBet = nextSelectedBet;
        }

        prohibitedPercentage = $auth.user?.prohibitedPercentage;
    });

    $effect(() => {
        const items = Array.isArray(data?.numbers) ? (data.numbers as NumberTotal[]) : [];

        const matrix = Object.fromEntries(
            Array.from({ length: 100 }, (_, i) => [i, 0])
        ) as Record<number, number>;

        for (const item of items) {
            matrix[item.number] = Number(item.amount) || 0;
        }

        sellingMatrix.set(matrix);
        total.set(Object.values(matrix).reduce((sum, value) => sum + value, 0));

        isMatrixLoading = false;
    });

    $effect(() => {
        const scheduleId = selectedBet?.schedule_id ?? null;
        const activeScheduleId = Number(data?.selectedScheduleId ?? null);

        if (!scheduleId || scheduleId === activeScheduleId) {
            return;
        }

        isMatrixLoading = true;

        void goto(`?scheduleId=${scheduleId}`, {
            replaceState: true,
            noScroll: true,
            keepFocus: true
        });
    });

    $effect(() => {
        const items = Array.isArray(data?.prohibitedItems) ? (data.prohibitedItems as ProhibitedNumber[]) : [];
        prohibitedNumbers.set(
            items.map((item) => ({
                id: item.id,
                number: Number(item.number),
                amount: Number(item.amount),
                starter: Number(item.starter),
                can_sell_after_amount: Boolean(item.can_sell_after_amount),
                by_amount: Boolean(item.by_amount),
                by_percentage: Boolean(item.by_percentage)
            }))
        );
    });

    $effect(() => {
        const intervalId = setInterval(() => {now = new Date(); }, 1000);        
        return () => clearInterval(intervalId);
    });

    function parseScheduleTime(value: string) {
        if (!value) return null;

        const match = value.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) return null;

        const hours = Number(match[1]);
        const minutes = Number(match[2]);

        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
            return null;
        }

        return hours * 60 + minutes;
    }

    function isBetOpen(scheduleTime: string, currentTime: Date) {
        const scheduleMinutes = parseScheduleTime(scheduleTime);

        if (scheduleMinutes === null) {
            return false;
        }

        const currentMinutes =
            currentTime.getHours() * 60 +
            currentTime.getMinutes();

        return scheduleMinutes > currentMinutes;
    }

    async function handlePDFPrint(ticket: TicketRow, soldNumbers: TicketSold[], position: number | null) {
        const lineHeight = 6;
        const leftX = 6;
        const rightX = 74;
        const minDotsStartX = 16;
        const minDotsEndX = 60;

        const groupedSoldNumbers = (() => {
            const groups = new Map<number, string[]>();
            for (const sold of soldNumbers) {
                const price = Number(sold.price) || 0;
                if (!groups.has(price)) {
                    groups.set(price, []);
                }
                groups.get(price)?.push(String(sold.number).padStart(2, '0'));
            }

            return Array.from(groups.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([price, numbers]) => ({ price, numbers }));
        })();

        const buildNumberLines = (doc: jsPDF, numbers: string[]) => {
            if (numbers.length === 0) {
                return [''];
            }

            const maxTextWidth = minDotsEndX - leftX - 2;
            const lines: string[] = [];
            let current = '';

            for (const num of numbers) {
                const next = current ? `${current} x ${num}` : num;
                if (doc.getTextWidth(next) > maxTextWidth && current) {
                    lines.push(current);
                    current = num;
                    continue;
                }
                current = next;
            }

            if (current) {
                lines.push(current);
            }

            return lines;
        };

        const groupedSoldLines = (doc: jsPDF) =>
            groupedSoldNumbers.map((group) => ({
                price: group.price,
                lines: buildNumberLines(doc, group.numbers)
            }));

        const estimateHeight = (lines: number, hasAddress: boolean) => {
            let y = 10;
            y += 6; // serial
            y += 6; // nro
            y += 6; // hora
            y += 6; // fecha
            y += 6; // branch name
            if (hasAddress) {
                y += 6;
            }
            y += 8; // gap before details
            y += lines * lineHeight; // details
            y += 2; // gap before sum line
            y += 6; // total line
            return y + 8; // bottom padding
        };

        const branchName = $auth.user?.branchName ? String($auth.user.branchName) : 'Sucursal';
        const branchAddress = $auth.user?.branchLocation ? String($auth.user.branchLocation) : '';

        const tempDoc = new jsPDF({ unit: 'mm', format: [80, 300] });
        const measuredGroups = groupedSoldLines(tempDoc);
        const totalDetailLines = measuredGroups.reduce((sum, group) => sum + group.lines.length, 0);
        const pageHeight = Math.max(90, estimateHeight(totalDetailLines, !!branchAddress));
        const doc = new jsPDF({ unit: 'mm', format: [80, pageHeight] });

        const serial = ticket.serial ?? 'Sin serial';
        const time = ticket.time ?? 'Sin hora';
        const date = ticket.date ?? 'Sin fecha';
        const total = Number.isFinite(ticket.total) ? ticket.total.toFixed(2) : '0.00';

        let y = 10;
        doc.setFontSize(10);
        doc.text(`${serial}`, 6, y);
        y += 6;
        doc.text(`Nro: ${position ?? '-'} `, 6, y);
        y += 6;
        doc.text(`Hora: ${time}`, 6, y);
        y += 6;
        doc.text(`Fecha: ${date}`, 6, y);
        y += 6;
        doc.text(branchName, 6, y);
        if (branchAddress) {
            y += 6;
            doc.text(branchAddress, 6, y);
        }

        y += 8;
        doc.setFontSize(10);
        for (const item of groupedSoldLines(doc)) {
            const amountText = Number.isFinite(item.price) ? item.price.toFixed(2) : '0.00';
            item.lines.forEach((line, index) => {
                doc.text(line, leftX, y);
                if (index === 0) {
                    doc.text(amountText, rightX, y, { align: 'right' });
                    const dotsStartX = Math.max(minDotsStartX, leftX + doc.getTextWidth(line) + 4);
                    const dotsEndX = Math.min(minDotsEndX, rightX - doc.getTextWidth(amountText) - 4);
                    doc.setLineWidth(0.2);
                    doc.setLineDashPattern([1, 1], 0);
                    if (dotsEndX > dotsStartX) {
                        doc.line(dotsStartX, y - 1, dotsEndX, y - 1);
                    }
                }
                y += lineHeight;
            });
        }
        doc.setLineDashPattern([], 0);
        y += 2;
        doc.setLineWidth(0.3);
        doc.line(leftX, y, rightX, y);
        y += 6;
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([1, 1], 0);
        doc.text('Total', leftX, y);
        doc.text(total, rightX, y, { align: 'right' });
        const totalDotsStartX = Math.max(minDotsStartX, leftX + doc.getTextWidth('Total') + 4);
        const totalDotsEndX = Math.min(minDotsEndX, rightX - doc.getTextWidth(total) - 4);
        if (totalDotsEndX > totalDotsStartX) {
            doc.line(totalDotsStartX, y - 1, totalDotsEndX, y - 1);
        }
        doc.setLineDashPattern([], 0);

        const safeSerial = serial.replace(/[^A-Za-z0-9_-]/g, '_');
        doc.save(`ticket-${safeSerial}.pdf`);
    }

    async function getTickets() {
        const scheduleId = selectedBet?.schedule_id ?? null;
        if (!scheduleId || !selectedDate) {
            tickets = [];
            ticketNumbers = [];
            return tickets;
        }

        const url = new URL('/puesto/venta/tickets', window.location.origin);
        url.searchParams.set('scheduleId', String(scheduleId));
        url.searchParams.set('date', selectedDate);

        const response = await fetch(url.toString(), { method: 'GET' });
        if (!response.ok) {
            tickets = [];
            ticketNumbers = [];
            return tickets;
        }

        const payload = await response.json().catch(() => null);
        const items = Array.isArray(payload?.items) ? (payload.items as TicketHeader[]) : [];
        const numbers = Array.isArray(payload?.numbers) ? (payload.numbers as Numbers[]) : [];

        tickets = items.map((item) => ({
            id: item.id,
            scheduleName: selectedBet?.schedule_name ?? '',
            scheduleTime: selectedBet?.schedule_time ?? '',
            drawName: selectedBet?.draw_name ?? '',
            branchName: $auth.user?.branchName,
            serial: item.serial,
            total: Number(item.amount) || 0,
            details: item.detail ?? '',
            time: item.time ?? '',
            date: item.date ?? '',
            status: item.enabled
        }));
        ticketNumbers = numbers;

        return tickets;
    }

    function getSoldNumbersForTicket(ticketId: number) {
        const ticket = tickets.find((item) => item.id === ticketId);
        if (!ticket) {
            return [];
        }

        return ticketNumbers
            .filter((number) => number.ticket_header_serial === ticket.serial)
            .map((number) => ({
                number: String(number.number).padStart(2, '0'),
                price: Number(number.amount) || 0
            }));
    }
</script>

<svelte:head>
	<title>Venta</title>
</svelte:head>

{#if ['branch'].includes($auth.user?.role ?? '')}
<section class="sell-container">
        <SellHeader
            bind:selectedDate={selectedDate}
            bind:availableBets={availableBets}
            bind:selectedBet={selectedBet}
            bind:prohibitedPercentage={prohibitedPercentage}
        />
    <section class="set-section">
        <Sell 
            getTickets={getTickets}
            selectedDate={selectedDate}
            getSoldNumbersForTicket={getSoldNumbersForTicket}
            selectedBet={selectedBet}
            prohibitedPercentage={prohibitedPercentage}
            handlePDFPrint={handlePDFPrint}
        />
        <Matrix 
            rows={20}
            columns={5}
            animateKey={selectedBet?.schedule_id ?? "none"}
            isLoading={isMatrixLoading}
            prohibitedPercentage={prohibitedPercentage}
        />
    </section>
</section>
{/if}

<style>
    .sell-container {
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
        align-items: start;
    }
    
    .set-section {
        gap: 1rem;
        width: 100%;
        display: flex;
        flex-direction: row;
    }
</style>