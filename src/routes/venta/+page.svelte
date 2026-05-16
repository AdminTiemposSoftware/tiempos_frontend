<script lang="ts">
    import { goto } from '$app/navigation';
    import Matrix from "$lib/components/venta/Matrix.svelte";
    import Sell from "$lib/components/venta/Sell.svelte";
    import SellHeader from "$lib/components/venta/SellHeader.svelte";
    import SellFooter from "$lib/components/venta/SellFooter.svelte";
    import { prohibitedNumbers } from "../../lib/stores/UpdateSellMatrix";
    import { sellingMatrix } from "../../lib/stores/UpdateSellMatrix";
    import { auth } from "$lib/stores/auth";
    import { total } from "../../lib/stores/UpdateSellMatrix";

    let { data } = $props();

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

    // TODO This is all testing data, replace with actual data from the database
    prohibitedNumbers.set([3, 7, 13, 17, 23, 27, 33, 40, 51, 57, 61, 71, 73, 83]); 
    let selectedDate = $state(new Date().toISOString().split('T')[0]);
    let selectedBet = $state<AvailableBet | null>(null);
    let prohibitedPercentage = $state(0.03);
    let availableBets = $state<AvailableBet[]>([]);
    let tickets = $state([
            { id: 1, total: 150, details: "Ticket 1 details", status: true },
            { id: 2, total: 50, details: "Ticket 2 details", status: true },
            { id: 3, total: 75, details: "Ticket 3 details", status: false }
        ]); // TODO
    let soldNumbersForTicket = $state([{number: 1, price: 100}, {number: 2, price: 50}]); 

    function formatCloseTime(scheduleTime: string) {
        return scheduleTime.slice(0, 5);
    }

    $effect(() => {
        const items = Array.isArray(data?.items) ? (data.items as AvailableBet[]) : [];
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

        availableBets = mappedBets;

        const selectedScheduleId = Number(data?.selectedScheduleId ?? null);
        selectedBet = mappedBets.find((bet) => bet.schedule_id === selectedScheduleId)
            ?? mappedBets[0]
            ?? null;
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
    });

    $effect(() => {
        const scheduleId = selectedBet?.schedule_id ?? null;
        const activeScheduleId = Number(data?.selectedScheduleId ?? null);

        if (!scheduleId || scheduleId === activeScheduleId) {
            return;
        }

        void goto(`?scheduleId=${scheduleId}`, {
            replaceState: true,
            noScroll: true,
            keepFocus: true
        });
    });

    function getTickets() {
        // TODO Implement functionality to fetch tickets for the selected date and bet
        return tickets;
    }

    function getSoldNumbersForTicket(ticketId: number) {
        // TODO Implement functionality to get sold numbers for a ticket
        return soldNumbersForTicket;
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
    <SellFooter prohibitedPercentage={prohibitedPercentage} />
    <section class="set-section">
        <Sell 
            getTickets={getTickets}
            getSoldNumbersForTicket={getSoldNumbersForTicket}
            selectedBet={selectedBet}
            prohibitedPercentage={prohibitedPercentage}
        />
        <Matrix 
            rows={20}
            columns={5}
            prohibitedPercentage={prohibitedPercentage}
        />
    </section>
</section>
{/if}

<style>
    .sell-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
        align-items: start;
    }
    
    .set-section {
        gap: 1rem;
        display: flex;
        flex-direction: row;
    }
</style>