<script lang="ts">
    import { total } from "../../stores/UpdateSellMatrix";

    let { selectedDate = $bindable(), closeTime = $bindable(), message = $bindable(), availableBets = $bindable() } =
        $props();
    let selectedBet = $state(availableBets[0]);
    let showSorteoOptions = $state(false);

    function parseCloseTime(value: string) {
        if (!value) {
            return null;
        }
        const match = value.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) {
            return null;
        }
        const hours = Number(match[1]);
        const minutes = Number(match[2]);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
            return null;
        }
        return hours * 60 + minutes;
    }

    function minutesUntilClose(closeTime: string) {
        const closeMinutes = parseCloseTime(closeTime);
        if (closeMinutes === null) {
            return Number.MAX_SAFE_INTEGER;
        }
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const diff = closeMinutes - nowMinutes;
        return diff >= 0 ? diff : diff + 24 * 60;
    }

    function getSortedBets(bets) {
        return [...bets].sort(
            (a, b) => minutesUntilClose(a.closeTime) - minutesUntilClose(b.closeTime)
        );
    }
</script>

<header>
    <div class="header-left">
        <div class="date-section">
            <span>Día:</span>
            <input type="date" id="date" bind:value={selectedDate} />
        </div>

        <span class="label">Total: ₡{$total}</span>
    </div>
    <div class="header-right">
        <div class="spans">
            <span class="sorteo-label">Sorteo:</span>
            <span class="label">Cierre: </span>
        </div>
        <div class="spans">
            <div class="sorteo-radio">
                <div class="sorteo-dropdown">
                    <button
                        class="sorteo-trigger"
                        onclick={() => (showSorteoOptions = !showSorteoOptions)}
                        aria-expanded={showSorteoOptions}
                        aria-controls="sorteo-options"
                    >
                        {selectedBet?.name ?? 'Seleccionar'}
                    </button>
                    {#if showSorteoOptions}
                        <div class="sorteo-options scroll-thin" id="sorteo-options">
                            {#each getSortedBets(availableBets) as bet}
                                <label class="sorteo-option">
                                    <input
                                        type="radio"
                                        name="sorteo"
                                        bind:group={selectedBet}
                                        value={bet}
                                        onchange={() => (showSorteoOptions = false)}
                                    />
                                    <span>{bet.name}</span>
                                </label>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
                <span>{selectedBet.closeTime} </span>
        </div>
    </div>

    <!-- <div class="info-item">// TODO
        <span class="label">Restricciones:</span>
        <div class="restriction-buttons">
            <button class="restriction-btn">Globales</button>
            <button class="restriction-btn">Bloqueos</button>
        </div>
    </div> -->

</header>

<style>
    header {
        display: flex;
        flex-direction: row;
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
    .sorteo-radio {
        display: flex;
        flex: 5;
        gap: 0.75rem;
        align-items: center;
        min-width: 0;
    }
    .sorteo-label {
        font-weight: 600;
        white-space: nowrap;
    }
    .sorteo-dropdown {
        position: relative;
        flex: 1;
    }
    .sorteo-trigger {
        width: 100%;
        justify-content: space-between;
        background-color: var(--color-theme-1);
        color: #fff;
    }
    .sorteo-options {
        display: flex;
        position: absolute;
        z-index: 5;
        left: 0;
        background: #fff;
        border: 1px solid var(--color-border);
        border-radius: 6px;
        padding: 0.5rem;
        overflow-x: auto;
        max-height: 200px;
        gap: 0.5rem;
        min-width: 0;
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

    .header-right {
        display: flex;
        gap: 1rem;
        flex: 1;
        border: 1px solid var(--color-border);
        padding: 0.75rem;
    }
    .header-right *{
        justify-content: space-between;
        margin-left: auto;
    }
    .header-left {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        flex: 1;
        border: 1px solid var(--color-border);
        padding: 0.75rem;
    }
    span{
        font-size: 1.25rem;
    }
    .spans {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
</style>
