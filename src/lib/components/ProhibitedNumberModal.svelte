<script lang="ts">
	import { onMount } from 'svelte';
	type ProhibitedNumber = {
		id: number;
		number: number;
		amount: number;
		starter: number;
		can_sell_after_amount: boolean;
		by_amount: boolean;
		by_percentage: boolean;
	}
	const defaultProhibitedNumber: ProhibitedNumber = {
		id: -1,
		number: 0,
		amount: 0,
		starter: 0,
		can_sell_after_amount: false,
		by_amount: false,
		by_percentage: true
	};
	
	let {
		showModal = $bindable(),
		prohibited = $bindable<ProhibitedNumber>(defaultProhibitedNumber),
		title = 'Agregar numero restringido',
		confirmText = 'Guardar',
		cancelText = 'Cancelar',
		handleAddProhibitedNumber = $bindable(),
		handleUpdateProhibitedNumber = $bindable(),
		handleDeleteProhibitedNumber = $bindable()
	} = $props();

	let numberInput: HTMLInputElement;
	let amountInput: HTMLInputElement;
	let starterInput: HTMLInputElement;	

	onMount(() => {
		numberInput?.focus();
	});

	function onClose() {
		showModal = false;
	}

	function handleSubmit() {
		if (prohibited.number === undefined || 
			prohibited.amount === undefined || 
			prohibited.starter === undefined
		) {
			console.log('Número, monto y monto de arranque son requeridos');
			return;
		}

		try {
			if (prohibited.id === -1) {
				handleAddProhibitedNumber?.(prohibited);
			} else {
				handleUpdateProhibitedNumber?.(prohibited);
			}
		} catch (error) {
			console.error('Error al confirmar número restringido:', error);
		}
	}
	function handlekeyinput(event: KeyboardEvent) {
		const target = event.target;

		if (event.key === 'Enter') {
			event.preventDefault();
			if (target instanceof HTMLInputElement && target.id === 'prohibited-number') {
				amountInput.focus();
			} else if (target instanceof HTMLInputElement && target.id === 'prohibited-amount') {
				starterInput.focus();
			} else if (target instanceof HTMLInputElement && target.id === 'prohibited-starter') {
				handleSubmit();

			}
		}
	}
</script>

<svelte:window onkeydown={handlekeyinput} />
{#if showModal}
	<div
		class="modal-backdrop"
		role="button"
		onclick={onClose}
		onkeydown={(e) => e.key === "Escape" && onClose()}
		tabindex="0"
	>
		<div class="modal" onclick={(e) => e.stopPropagation()} role="presentation">
			<h2 class="modal-title">{title}</h2>
			<form
				class="modal-form"
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
					
				<div class="row">
					<div class="number-field">
						<label class="modal-label" for="prohibited-number">Numero</label>
						<input
							class="modal-input"
							id="prohibited-number"
							type="number"
							inputmode="numeric"
							bind:this={numberInput}
							bind:value={prohibited.number}
							required
						/>
					</div>
					<div class="amount-field">
						<label class="modal-label" for="prohibited-amount">Monto</label>
						<input
							class="modal-input"
							id="prohibited-amount"
							type="number"
							inputmode="decimal"
							min="0"
							step="0.01"
							bind:this={amountInput}
							bind:value={prohibited.amount}
							required
						/>
					</div>
					<div class="amount-field">
						<label class="modal-label" for="prohibited-starter">Monto de arranque</label>
						<input
							class="modal-input"
							id="prohibited-starter"
							type="number"
							inputmode="decimal"
							min="0"
							step="0.01"
							bind:this={starterInput}
							bind:value={prohibited.starter}
							required
						/>
					</div>
				</div>
				<div class="checkbox-field">
					<label class="modal-label" for="prohibited-check">Puede vender despues del monto</label>
					<input
						class="switch-input"
						type="checkbox"
						checked={prohibited.can_sell_after_amount}
						onchange={(e) => (prohibited.can_sell_after_amount = e.currentTarget.checked)}
					/>
				</div>
				<div class="checkbox-field">
					<label class="modal-label" for="prohibited-by-amount">Por monto</label>
					<input
						class="switch-input"
						type="checkbox"
						checked={prohibited.by_amount}
						onchange={(e) => (prohibited.by_amount = e.currentTarget.checked)}
					/>
				</div>
				<div class="checkbox-field">
					<label class="modal-label" for="prohibited-by-percentage">Porcentaje</label>
					<input
						class="switch-input"
						type="checkbox"
						checked={prohibited.by_percentage}
						onchange={(e) => (prohibited.by_percentage = e.currentTarget.checked)}
					/>
				</div>
				<div class="modal-actions modal-actions--form">
					<button type="button" onclick={onClose}>{cancelText}</button>
					<button type="submit">{confirmText}</button>
				</div>

				{#if handleDeleteProhibitedNumber && prohibited.id !== -1}
					<button
						type="button"
						onclick={() => handleDeleteProhibitedNumber(prohibited)}
						class="negative"
					>
						Eliminar numero restringido
					</button>
				{/if}
			
			</form>
		</div>
	</div>
{/if}

<style> 
	.modal {
		width: 500px;
	}
	.modal-form{
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.row {
		display: flex;
		flex-direction: row;
		width: 100%;
		gap: 1rem;
	}
	.row input {
		width: 100%;
	}
	.number-field {
		flex: 1;
	}
	.amount-field {
		flex: 3;
	}
	.checkbox-field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.checkbox-field .modal-label {
		margin: 0;
	}
</style>