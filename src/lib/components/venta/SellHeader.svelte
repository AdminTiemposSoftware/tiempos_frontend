<script lang="ts">
    import { total } from "../../stores/UpdateSellMatrix";

    let { 
        selectedDate = $bindable(), 
        message = $bindable(), 
        availableBets = $bindable(),
        selectedBet = $bindable(),
        prohibitedPercentage = $bindable()
    } = $props();

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

    function getSortedBets(bets: typeof availableBets) {
        return [...bets].sort(
            (a, b) => minutesUntilClose(a.closeTime) - minutesUntilClose(b.closeTime)
        );
    }

    function formatAmount(value: number) {
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
                <span>₡{formatAmount($total)}</span>
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
                            />
                            <span>{bet.draw_name} {bet.schedule_name}</span>
                        </label>
                    {/each}
                </div>
            </div>
            <span class="label">Cierre: {selectedBet?.schedule_time}</span>
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
