<script lang="ts">
    import { total } from "../../stores/UpdateSellMatrix";

    let { selectedDate = $bindable(), closeTime = $bindable(), message = $bindable(), availableBets = $bindable() } =
        $props();
    let selectedBet = $state(availableBets[0]);
    let visibleBetNames = $state(availableBets.map((bet) => bet.name));
    let showCustomizations = $state(false);

    function selectBet(bet) {
        selectedBet = bet;
    }

    function toggleVisibleBet(name: string) {
        visibleBetNames = visibleBetNames.includes(name)
            ? visibleBetNames.filter((entry) => entry !== name)
            : [...visibleBetNames, name];
        if (!visibleBetNames.includes(selectedBet?.name)) {
            const nextVisible = availableBets.find((bet) => visibleBetNames.includes(bet.name));
            if (nextVisible) {
                selectedBet = nextVisible;
            }
        }
    }
</script>

<header>
    <div class="header-top">
        <div class="date-section">
            <label for="date">Día:</label>
            <input type="date" id="date" bind:value={selectedDate} />
        </div>
        <div class="customization-section">
            <button
                class="customize-toggle"
                onclick={() => (showCustomizations = !showCustomizations)}
                aria-expanded={showCustomizations}
                aria-controls="sorteo-customizations"
            >
                Sorteos visibles
            </button>
            {#if showCustomizations}
                <div class="sorteo-panel" id="sorteo-customizations">
                    <div class="sorteo-buttons">
                        {#each availableBets as bet}
                            <label class="sorteo-option">
                                <input
                                    type="checkbox"
                                    checked={visibleBetNames.includes(bet.name)}
                                    onchange={() => toggleVisibleBet(bet.name)}
                                />
                                <span>{bet.name}</span>
                            </label>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
        <div class="buttons-section scroll-thin">
            {#each availableBets.filter((bet) => visibleBetNames.includes(bet.name)) as bet}
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

        <!-- <div class="info-item">
            <span class="label">Restricciones:</span>
            <div class="restriction-buttons">
                <button class="restriction-btn">Globales</button>
                <button class="restriction-btn">Bloqueos</button>
            </div>
        </div> -->

        <div class="info-item">
            <span class="label">Cierre: {selectedBet.closeTime}</span>
        </div>
    </div>
</header>

<style>
    .header-top {
        display: flex;
        gap: 1.5rem;
        align-items: center;
        width: 100%;
    }

    .date-section {
        display: flex;
        flex: 1;
        gap: 0.5rem;
        align-items: center;
    }
    .customize-toggle {
        padding: 0.5rem 1rem;
        font-size: 1rem;
        background-color: var(--color-theme-1);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
    }
    .sorteo-panel {
        margin-top: 0.5rem;
        border: 1px solid var(--color-border);
        padding: 0.5rem;
        border-radius: 6px;
        background: #fff;
        position: absolute;
        width: 300px;
    }
    .sorteo-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    .sorteo-option {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--color-border);
        background: var(--color-bg-2);
    }

    .buttons-section {
        display: flex;
        overflow-x: auto;
        gap: 0.5rem;
        flex: 5;
    }
    .buttons-section button {
        white-space: nowrap;
        padding: 0rem 0.5rem;
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
    .customization-section {
        position: relative;
        flex: 1;
    }
    span{
        font-size: 1.25rem;
    }
</style>
