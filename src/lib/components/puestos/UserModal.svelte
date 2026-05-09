<script lang="ts">
	type user = {
		id?: number;
		username: string;
		name: string;
		phone: string;
        password?: string;
	};

	const defaultUser: user = {
		username: '',
		name: '',
		phone: '',
		password: undefined
	};

	let { 
		showModal = $bindable(), 
		user = $bindable({ ...defaultUser }),
		updateUser = $bindable(),
		addUser = $bindable()
	} = $props();

	let wasOpen = false;

	$effect(() => {
		if (showModal && !wasOpen) {
			const merged = { ...defaultUser, ...(user ?? {}) } as user;
			user = merged;
		}
		wasOpen = showModal;
	});

	function onClose() {
		showModal = false;
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
		{#if user}
			<div
				class="modal"
				onclick={(e) => e.stopPropagation()}
				role="presentation"
			>
				<h2 class="modal-title">{user?.id ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</h2>
				<form class="modal-form"
                    method="POST"
                    action="?/addUser"
				>
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
                        type="text" 
                        bind:value={user.password} 
                        required 
                        name="password"
                    />

					<div class="modal-actions">
						<button type="button" onclick={onClose} >Cancelar</button>
						<button type="submit" >Guardar</button>
					</div>
				</form>
			</div>
		{/if}
	</div>
{/if}
