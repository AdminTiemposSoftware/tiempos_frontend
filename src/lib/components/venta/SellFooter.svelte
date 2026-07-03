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

	function getOverageAmountOnProhibited(prohibitedNumber: { id: number; number: number; by_amount?: boolean; amount: number; by_percentage?: boolean; can_sell_after_amount?: boolean;  }) {
		if (prohibitedNumber?.by_amount) {
			if ($sellingMatrix?.[prohibitedNumber.number] > prohibitedNumber.amount) {
				return $sellingMatrix?.[prohibitedNumber.number] - prohibitedNumber.amount;
			}
		}else if (prohibitedNumber?.by_percentage){
			if ($sellingMatrix?.[prohibitedNumber.number] && ($total * prohibitedPercentage) < $sellingMatrix?.[prohibitedNumber.number]) {
				return $sellingMatrix?.[prohibitedNumber.number] - ($total * prohibitedPercentage);
			}
		}
		return 0;
	}

	function isOverage (prohibitedNumber: { id: number; number: number; by_amount?: boolean; amount: number; by_percentage?: boolean; can_sell_after_amount?: boolean;  }) {
		if (prohibitedNumber?.by_amount){
			if (prohibitedNumber?.amount === 0 || $sellingMatrix?.[prohibitedNumber.number] === prohibitedNumber.amount) {
				return true;
			}
		}
		return getOverageAmountOnProhibited(prohibitedNumber) > 0;
	}
</script>
<header>
    <div class="prohibited">
        <!-- <span class="label">Excedente:</span> -->
        <div class="prohibited-list">
            {#if $prohibitedNumbers?.length}
                {#each $prohibitedNumbers as number}
                    <div class="prohibited-badge {isOverage(number) ? 'prohibited-over' : ''}">
                        <span>{number.number}</span>
						<div class="prohibited-info">
							<span>
								Excedente: ₡{formatAmount(getOverageAmountOnProhibited(number))}
							</span>
						</div>
                    </div>
                {/each}
            {:else}
                <span class="prohibited-empty">-</span>
            {/if}
        </div>
    </div>
    <span>Actualmente tienes los prohibidos al {prohibitedPercentage}% por lo que solo tienes permitido vender ₡{formatAmount(availableAmountOnProhibited)}</span>
</header>

<style>
    header {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem;
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
		border-radius: 100%;
        box-sizing: border-box;
		flex: 0 0 auto;
		padding: 0.5rem 0.5rem;
		position: relative;
		cursor: pointer;
	}

	.prohibited-badge:hover {
		transform: translateY(-1px);
	}
	.prohibited-badge span {
		font-size: 0.9rem !important;
	}
	.prohibited-info {
		display: none;
		position: absolute;
		background-color: #fff;
		bottom: 110%;
		left: 50%;
		transform: translateX(-50%);
		flex-direction: column;
		align-items: center;
		font-size: 0.75rem;
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
	}
	.prohibited-badge:hover .prohibited-info {
		display: flex;
	}
	.prohibited-over {
		border-color: var(--color-theme-3);
	}
</style>
