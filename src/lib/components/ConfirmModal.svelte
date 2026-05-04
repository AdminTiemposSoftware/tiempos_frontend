<script lang="ts">	
    let {
		confirm,
		showModal = $bindable(),
		message = 'Estas seguro de continuar?',
		confirmText = 'Confirmar',
		cancelText = 'Cancelar'
	} = $props();

	function onClose() {
		showModal = false;
	}

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
			<div class="modal-actions">
				<button type="button" onclick={onClose}>
					{cancelText}
				</button>
				<button type="button" class="negative" onclick={handleConfirm}>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
