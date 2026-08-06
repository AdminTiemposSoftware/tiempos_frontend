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
        days: string[];
        position_number: number;
        multiplier: number;
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
        printed_at: string;
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
        const items = Array.isArray(data?.drawItems) ? (data.drawItems as { schedule_id: number, day_name: string, draw_schedule_branch_id: number, comission: string | number, schedule_name: string, schedule_time: string, draw_id: number, draw_name: string, draw_is_reventado: boolean, draw_is_megareventado: boolean, position_number: number, multiplier: number }[]) : [];

        const mappedBets = Object.values(
            items.reduce((acc, item) => {
                if (!acc[item.schedule_id]) {
                    acc[item.schedule_id] = {
                        draw_schedule_branch_id: item.draw_schedule_branch_id,
                        comission: item.comission,
                        schedule_id: item.schedule_id,
                        schedule_name: item.schedule_name,
                        schedule_time: formatCloseTime(item.schedule_time),
                        draw_id: item.draw_id,
                        draw_name: item.draw_name,
                        draw_is_reventado: item.draw_is_reventado,
                        draw_is_megareventado: item.draw_is_megareventado,
                        days: [],
                        position_number: item.position_number,
                        multiplier: item.multiplier
                    };
                }

                acc[item.schedule_id].days.push(item.day_name);

                return acc;
            }, {} as Record<number, any>)
        );

        availableBets = mappedBets;

        const selectedScheduleId =
            selectedBet?.schedule_id ??
            Number(data?.selectedScheduleId ?? null);

        const nextSelectedBet =
            mappedBets.find(
                (bet) => bet.schedule_id === selectedScheduleId
            ) ??
            mappedBets[0] ??
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
            printed_at: item.printed_at ?? '',
            multiplier: selectedBet?.multiplier ?? '',
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
