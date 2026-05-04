<script lang="ts">
    import Matrix from "$lib/components/venta/Matrix.svelte";
    import Sell from "$lib/components/venta/Sell.svelte";
    import SellHeader from "$lib/components/venta/SellHeader.svelte";
    import { prohibitedNumbers } from "../../lib/stores/UpdateSellMatrix";
    import { sellingMatrix } from "../../lib/stores/UpdateSellMatrix";
    import { total } from "../../lib/stores/UpdateSellMatrix";

    // TODO This is all testing data, replace with actual data from the database
    prohibitedNumbers.set([3, 7, 13, 17, 23, 27, 33, 40, 51, 57, 61, 71, 73, 83]); 
    let selectedDate = new Date().toISOString().split('T')[0];
    let closeTime = 'N/A';
    let message = '';
    let availableBets = [
        { name: "Nica Tarde", closeTime: "18:00" },
        { name: "Nica Noche", closeTime: "22:00" },
        { name: "Nica Dia", closeTime: "12:00" },
        { name: "Tiempos Manana", closeTime: "10:30" },
        { name: "Tiempos Tarde", closeTime: "15:30" },
        { name: "Tiempos abs", closeTime: "20:30" },
        { name: "Tiempos zqe", closeTime: "10:30" },
        // { name: "Tiempos 13", closeTime: "15:30" },
        { name: "Tiempos 888", closeTime: "20:30" }
    ]; // TODO
    let tickets = [
            { id: 1, total: 150, details: "Ticket 1 details", status: true },
            { id: 2, total: 50, details: "Ticket 2 details", status: true },
            { id: 3, total: 75, details: "Ticket 3 details", status: false }
        ]; // TODO
    let soldNumbersForTicket = [{number: 1, price: 100}, {number: 2, price: 50}]; 
    sellingMatrix.set({
        0: 100,
        1: 50,
        2: 75
    });
    // TODO Implement functionality to calculate total sales
    total.set(225);

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
<section class="sell-container">
    <section class="set-section">
        <SellHeader
            bind:selectedDate={selectedDate}
            bind:closeTime={closeTime}
            bind:message={message}
            bind:availableBets={availableBets}
        />
        <Sell 
            getTickets={getTickets}
            getSoldNumbersForTicket={getSoldNumbersForTicket}
        />
    </section>
    <Matrix 
        rows={20}
        columns={5}
    />
</section>

<style>
    .sell-container {
        display: flex;
        flex-direction: row;
        gap: 2rem;
        flex: 1;
        align-items: start;
    }
    
    .set-section {
        gap: 1rem;
        display: flex;
        flex-direction: column;
    }
</style>