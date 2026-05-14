<script lang="ts">
    import { total } from "../../stores/UpdateSellMatrix";
    import { prohibitedNumbers } from "../../stores/UpdateSellMatrix";

    let { 
        selectedDate = $bindable(), 
        message = $bindable(), 
        availableBets = $bindable(),
    } = $props();
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
    <div class="header-top">
        <div class="header-content left">
            <div class="spans">
                <span>Día:</span>
                <input type="date" id="date" bind:value={selectedDate} />
            </div>
            <div class="spans">
                <span class="label">Total:</span> 
                <span>₡{$total}</span>
            </div>
        </div>
        <div class="header-content right">
            <div class="spans">
                <span class="sorteo-label">Sorteo:</span>
                <div class="sorteo-radio">
                    {#each getSortedBets(availableBets) as bet}
                        <label class="sorteo-option">
                            <input
                                type="radio"
                                name="sorteo"
                                bind:group={selectedBet}
                                value={bet}
                                onchange={() => (showSorteoOptions = false)}
                            />
                            <span>{bet.draw_name} {bet.schedule_name}</span>
                        </label>
                    {/each}
                </div>
            </div>
            <span class="label">Cierre: {selectedBet?.schedule_time}</span>
        </div>
    </div>

    <div class="prohibited">
        <span class="label">Restringidos:</span>
        <div class="prohibited-list">
            {#if $prohibitedNumbers?.length}
                {#each $prohibitedNumbers as number}
                    <span class="prohibited-badge">{number}</span>
                {/each}
            {:else}
                <span class="prohibited-empty">-</span>
            {/if}
        </div>
    </div> 

</header>

<style>
    header {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
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
    .sorteo-option {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--color-border);
        background: var(--color-bg-2);
    }
    .sorteo-option span {
        font-size: 0.9rem;
    }
    .header-top {
        display: flex;
        gap: 1rem;
        flex: 1;
    }
    .header-content {
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
        flex-direction: row;
        gap: 1rem;
    }
    .right {
        flex:5;   
    }
    .left {
        flex: 1;
    }
</style>
