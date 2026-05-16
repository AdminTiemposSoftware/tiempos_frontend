<script lang="ts">
	import { sellingMatrix } from "../../stores/UpdateSellMatrix";
	import { total } from "../../stores/UpdateSellMatrix";
	import { prohibitedNumbers } from "../../stores/UpdateSellMatrix";

	let {
		prohibitedPercentage = $bindable()
	} = $props();

	let availableAmountOnProhibited = $state($total * prohibitedPercentage);

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

	$effect(() => {
		availableAmountOnProhibited = $total * prohibitedPercentage;
	});
</script>
<header>
    <div class="prohibited">
        <!-- <span class="label">Excedente:</span> -->
        <div class="prohibited-list">
            {#if $prohibitedNumbers?.length}
                {#each $prohibitedNumbers as number}
                    <div class="prohibited-badge">
                        <span>{number}</span>
                        <span>
                            ₡{formatAmount(
                                $sellingMatrix?.[number]
                                && ($total * prohibitedPercentage) < $sellingMatrix?.[number]
                                    ? $sellingMatrix?.[number] - ($total * prohibitedPercentage)
                                    : 0
                            )}
                        </span>
                    </div>
                {/each}
            {:else}
                <span class="prohibited-empty">-</span>
            {/if}
        </div>
    </div>
    <span>Actualmente tienes los prohibidos al {prohibitedPercentage * 100}% por lo que solo tienes permitido vender ₡{formatAmount(availableAmountOnProhibited)}</span>
</header>

<style>
    header {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem;
        background-color: #f5f5f5;
        text-align: center;
    }

	.prohibited {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.prohibited-list {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
        justify-content: center;
		align-items: center;
		flex-wrap: wrap;
	}
	.prohibited-badge {
		display: flex;
		flex-direction: column;
		/* padding: 1.5rem 2rem; */
		border-radius: 0.75rem;
        box-sizing: border-box;
		flex: 0 0 auto;
		width: fit-content;
        padding: 1.5rem 0.75rem;
	}
	.prohibited-badge span {
		font-size: 0.8rem !important;
	}
</style>
