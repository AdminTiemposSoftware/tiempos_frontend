<script lang="ts">
    import { total } from "../../stores/UpdateSellMatrix";
    import { onMount, onDestroy } from "svelte";
    import SellFooter from "$lib/components/venta/SellFooter.svelte";

    let { 
        selectedDate = $bindable(), 
        message = $bindable(), 
        availableBets = $bindable(),
        selectedBet = $bindable(),
        prohibitedPercentage = $bindable()
    } = $props();

    let now = $state(new Date());
    let intervalId: NodeJS.Timeout;

    onMount(() => {
        intervalId = setInterval(() => {
            now = new Date();
        }, 1000);
    });

    onDestroy(() => {
        clearInterval(intervalId);
    });

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
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const diff = closeMinutes - nowMinutes;
        return diff >= 0 ? diff : diff + 24 * 60;
    }

    function secondsUntilClose(closeTime: string) {
        const closeMinutes = parseCloseTime(closeTime);
        if (closeMinutes === null) {
            return Number.MAX_SAFE_INTEGER;
        }
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const nowSeconds = now.getSeconds();
        const closeSeconds = closeMinutes * 60;
        const nowTotalSeconds = nowMinutes * 60 + nowSeconds;
        let diff = closeSeconds - nowTotalSeconds;
        if (diff < 0) {
            diff = diff + 24 * 60 * 60;
        }
        return diff;
    }

    function formatTimeRemaining(seconds: number) {
        if (seconds === Number.MAX_SAFE_INTEGER) {
            return "N/A";
        }
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hours === 0 && minutes === 0) {
            return `${secs}s`;
        } else if (hours === 0) {
            return `${minutes}m ${secs}s`;
        }
        return `${hours}h ${minutes}m ${secs}s`;
    }

    function getSortedBets(bets: typeof availableBets) {
        return [...bets]
            .filter(bet => {
                const closeMinutes = parseCloseTime(bet.schedule_time || bet.closeTime);
                if (closeMinutes === null) {
                    return false;
                }
                const nowMinutes = now.getHours() * 60 + now.getMinutes();
                // Only show bets where the close time hasn't passed yet
                return closeMinutes >= nowMinutes;
            })
            .sort(
                (a, b) => minutesUntilClose(a.schedule_time || a.closeTime) - minutesUntilClose(b.schedule_time || b.closeTime)
            );
    }

    // TODO Globalize this function to a utility file since it's used in multiple places
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
                <span class="label">Cierre: {selectedBet?.schedule_time}</span>
                <span class="label">Tiempo restante: {formatTimeRemaining(secondsUntilClose(selectedBet?.schedule_time))}</span>
        </div>
        <div class="header-content right">
            <div class="header-content sorteo">
                <span class="sorteo-label">Sorteo:</span>
                <div class="sorteo-radio">
                    {#each getSortedBets(availableBets) as bet}
                        <label class="sorteo-option">
                            <input
                                type="radio"
                                name="sorteo"
                                checked={selectedBet?.schedule_id === bet.schedule_id}
                                onchange={() => selectedBet = bet}
                                class="sorteo-input"
                            />
                            <span class="sorteo-pill">{bet.draw_name} {bet.schedule_name}</span>
                        </label>
                    {/each}
                </div>
            </div>
            <SellFooter prohibitedPercentage={prohibitedPercentage} />
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
        align-self: center;
    }
    .sorteo-option {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        cursor: pointer;
    }
    .sorteo-input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }
    .sorteo-pill {
        display: inline-flex;
        align-items: center;
        padding: 0.35rem 0.75rem;
        border: 1px solid var(--color-border);
        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        font-size: 1rem;
        user-select: none;
    }
    .sorteo-input:checked + .sorteo-pill {
        background: var(--color-theme-1);
        color: #fff;
    }
    .sorteo-option:hover .sorteo-pill {
        border-color: var(--color-theme-2);
    }
    .header-top {
        display: flex;
        gap: 1rem;
        flex: 1;
    }
    .header-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
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
        flex:3;   
        padding: 0;
        border: none;
    }
    .sorteo {
        align-items: flex-start;
        text-align: left;
        flex-direction: row;
    }
    .left {
        flex: 1;
    }

</style>
