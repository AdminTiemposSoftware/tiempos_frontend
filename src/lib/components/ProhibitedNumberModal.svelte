<script lang="ts">
	let {
		showModal = $bindable(),
		value = $bindable(''),
		title = 'Agregar numero restringido',
		confirmText = 'Guardar',
		cancelText = 'Cancelar',
		onConfirm
	} = $props();

	function onClose() {
		showModal = false;
	}

	function handleSubmit() {
		if (onConfirm) {
			onConfirm(value);
		}
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
					type="text"
					inputmode="numeric"
					placeholder="Ej: 12"
					bind:value={value}
				/>
				<div class="modal-actions modal-actions--form">
					<button type="button" onclick={onClose}>{cancelText}</button>
					<button type="submit">{confirmText}</button>
				</div>
			</form>
		</div>
	</div>
{/if}
