<script lang="ts">
    import { total } from "../../stores/UpdateSellMatrix";

    let {selectedDate = $bindable(), closeTime = $bindable(), message = $bindable(), availableBets = $bindable() } = $props();
    let selectedBet = $state(availableBets[0]);

    function selectBet(bet: string) {
        selectedBet = bet;
    }
</script>

<header>
    <div class="header-top">
        <div class="date-section">
            <label for="date">Día:</label>
            <input type="date" id="date" bind:value={selectedDate} />
        </div>

        <div class="buttons-section">
            {#each availableBets as bet}
                <button 
                    class:selected={selectedBet.name === bet.name}
                    onclick={() => selectBet(bet)}
                >
                    {bet.name}
                </button>
            {/each}
        </div>
    </div>

    <div class="header-bottom">
        <div class="info-item">
            <span class="label">Total: ₡{$total}</span>
        </div>

        <div class="info-item">
            <span class="label">Restricciones:</span>
            <div class="restriction-buttons">
                <button class="restriction-btn">Globales</button>
                <button class="restriction-btn">Bloqueos</button>
            </div>
        </div>

        <div class="info-item">
            <span class="label">Cierre: {selectedBet.closeTime}</span>
        </div>

        <!-- TODO : Pretty sure this doesn't work as expected -->
        <!-- <div class="info-item">
            <span class="label">Mensaje:</span>
            <input type="text" bind:value={message} placeholder="Ingrese mensaje" />
        </div> -->
    </div>
</header>

<style>
    .header-top {
        display: flex;
        gap: 1.5rem;
        align-items: center;
    }

    .date-section {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .buttons-section {
        display: flex;
        gap: 0.5rem;
    }
    .buttons-section button {
        background-color: var(--color-border);
        color: var(--color-text);
    }

    .buttons-section button.selected {
        padding: 0.5rem 1rem;
        border: 1px solid var(--color-border);
        color: white;
	    background-color: #00c44b;
        cursor: pointer;
        transition: background-color 0.2s ease, color 0.2s ease;
    }

    .header-bottom {
        display: flex;
        gap: 2rem;
        border: 1px solid var(--color-border);
        padding: 0.75rem;
    }

    .info-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    span{
        font-size: 1.25rem;
    }

    .restriction-buttons {
        display: flex;
        gap: 0.25rem;
    }

</style>
