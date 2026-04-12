<script lang="ts">
	let {showModal = $bindable(), puesto = $bindable(
		{
			name: '',
			phone: '',
			commission: false,
			status: 'Activo',
			user: ''
		}
	) } = $props();


	function onClose() {
		showModal = false;
	}

	function handleSubmit() {
		console.log('Puesto data:', puesto);
		if (puesto?.id) {
		// TODO: Update existing puesto
		} else {
			// TODO: Add new puesto
		}
		onClose();
	}

	console.log('Puesto to edit:', puesto);
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
			<h2>{puesto?.id ? 'Editar Puesto' : 'Agregar Nuevo Puesto'}</h2>
			<form 
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<label for="name">Nombre</label>
				<input id="name" type="text" value={puesto?.name} required />

				<label for="phone">Teléfono</label>
				<input id="phone" type="text" value={puesto?.phone} />

				<label for="user">Usuario</label>
				<input id="user" type="text" value={puesto?.user} />

				<label for="status">Estado</label>
				<select id="status" value={puesto?.status}>
					<option value="Activo">Activo</option>
					<option value="Inactivo">Inactivo</option>
				</select>

				<div class="checkbox-container">
					<input id="commission" type="checkbox" checked={puesto?.commission} />
					<label for="commission">Ve comisión</label>
				</div>

				<div class="modal-actions">
					<button type="button" onclick={onClose} >Cancelar</button>
					<button type="submit">Guardar</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.checkbox-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
