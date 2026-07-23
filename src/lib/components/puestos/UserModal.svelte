<script lang="ts">
	type user = {
		id?: number;
		username: string;
		name: string;
		phone: string;
        password?: string;
	};

	let { 
		showModal = $bindable(), 
		user = $bindable({ id: -1, username: '', name: '', phone: '', password: '' }),
		updateUser = $bindable(),
		addUser = $bindable()
	} = $props();

	function onClose() {
		showModal = false;
	}

	async function handleSubmit() {
		if (!user) {
			return;
		}
		
		const payload: user = {
			id: user.id,
			username: user.username.trim(),
			name: user.name.trim(),
			phone: user.phone.trim(),
			password: user.password?.trim() || ''
		};

		if (!payload.username || !payload.name || !payload.phone) {
			return;
		}

		if (user.id && user.id > 0) 
			await updateUser(payload);
		else 
			await addUser(payload);
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
		<h2 class="modal-title">{user?.id ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</h2>
		<div class="modal-form" >
			<label class="modal-label" for="username">usuario</label>
			<input 
				class="modal-input" 
				id="username" 
				type="text" 
				bind:value={user.username} 
				required 
				name="username"
				/>

			<label class="modal-label" for="name">Nombre</label>
			<input 
				class="modal-input" 
				id="name" 
				type="text" 
				bind:value={user.name} 
				required 
				name="name"
			/>


			<label class="modal-label" for="phone">Teléfono</label>
			<input 
				class="modal-input" 
				id="phone" type="text" 
				bind:value={user.phone} 
				required 
				name="phone"
			/>

			<label class="modal-label" for="password">Contraseña</label>
			<input 
				class="modal-input" 
				id="password" 
				type="password" 
				bind:value={user.password} 
				required 
				name="password"
			/>

			<div class="modal-actions">
				<button type="button" onclick={onClose} >Cancelar</button>
				<button onclick={handleSubmit}>Guardar</button>
			</div>
		</div>
	</div>
</div>
{/if}
