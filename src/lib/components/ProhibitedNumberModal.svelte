<script lang="ts">
	let {
		showModal = $bindable(),
		number = $bindable(''),
		amount = $bindable(''),
		title = 'Agregar numero restringido',
		confirmText = 'Guardar',
		cancelText = 'Cancelar',
		onConfirm
	} = $props();

	function onClose() {
		showModal = false;
	}

	function handleSubmit() {
		onConfirm?.({ number, amount });
	}
</script>

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
				<label class="modal-label" for="prohibited-number">Numero</label>
				<input
					class="modal-input"
					id="prohibited-number"
					type="number"
					inputmode="numeric"
					placeholder="Ej: 12"
					bind:value={number}
				/>
				<label class="modal-label" for="prohibited-amount">Monto</label>
				<input
					class="modal-input"
					id="prohibited-amount"
					type="number"
					inputmode="decimal"
					min="0"
					step="0.01"
					placeholder="Ej: 1000"
					bind:value={amount}
				/>
				<div class="modal-actions modal-actions--form">
					<button type="button" onclick={onClose}>{cancelText}</button>
					<button type="submit">{confirmText}</button>
				</div>
			</form>
		</div>
	</div>
{/if}
