<script lang="ts">	
    let {
		confirm,
		showModal = $bindable(),
		message = 'Estas seguro de continuar?',
		input = $bindable(''),
		confirmText = 'Confirmar',
		cancelText = 'Cancelar'
	} = $props();
    let inputElement: HTMLInputElement;

	import { tick } from "svelte";

	function onClose() {
		showModal = false;
	}

	$effect(() => {
		showModal;
		setTimeout(() => {
			if (showModal)
				inputElement?.focus();
		}, 0);
	});

	function handleConfirm() {
		confirm();
		onClose();
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
		<div
			class="modal"
			onclick={(e) => e.stopPropagation()}
			role="presentation"
		>
			<p class="modal-text">{message}</p>
			<input
				type="text"
				placeholder="Ingrese el texto"
				bind:value={input}
				class="modal-input"
				bind:this={inputElement}
			/>
			<div class="modal-actions">
				<button type="button" class="negative" onclick={onClose}>
					{cancelText}
				</button>
				<button type="button" onclick={handleConfirm}>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		z-index: 10;
	}

	.modal-input {
		width: 100%;
		padding: 0.5rem;
		margin-bottom: 1rem;
	}
</style>
