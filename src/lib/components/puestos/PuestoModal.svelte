<script lang="ts">
	type Puesto = {
		id?: number;
		banking_id: number | '' | null;
		name: string;
		location: string;
		prohibited_percentage: number | '';
		users: string[];
	};

	const defaultPuesto: Puesto = {
		banking_id: null,
		name: '',
		location: '',
		prohibited_percentage: 0,
		users: []
	};

	let { 
		showModal = $bindable(), 
		puesto = $bindable({ ...defaultPuesto }),
		updatePuesto = $bindable(),
		addPuesto = $bindable()
	} = $props();
	let userInput = $state('');
	let wasOpen = false;

	$effect(() => {
		if (showModal && !wasOpen) {
			const merged = { ...defaultPuesto, ...(puesto ?? {}) } as Puesto;
			merged.users = Array.isArray(merged.users) ? merged.users : [];
			puesto = merged;
			userInput = '';
		}
		wasOpen = showModal;
	});

	function onClose() {
		showModal = false;
	}

	function addUser() {
		const value = userInput.trim();
		if (!puesto || !value) {
			return;
		}
		const exists = puesto.users.some((user) => user.toLowerCase() === value.toLowerCase());
		if (!exists) {
			puesto = { ...puesto, users: [...puesto.users, value] };
		}
		userInput = '';
	}

	function removeUser(value: string) {
		if (!puesto) {
			return;
		}
		puesto = { ...puesto, users: puesto.users.filter((user) => user !== value) };
	}

	function handleSubmit() {
		if (!puesto) {
			return;
		}
		const bankingId = puesto.banking_id === null || puesto.banking_id === ''
			? null
			: Number(puesto.banking_id);
		const payload: Puesto = {
			...puesto,
			banking_id: bankingId,
			name: puesto.name.trim(),
			location: puesto.location.trim(),
			prohibited_percentage: Number(puesto.prohibited_percentage || 0),
			users: puesto.users.map((user) => user.trim()).filter(Boolean)
		};

		if (!payload.name || !payload.location || payload.banking_id === null) {
			return;
		}

		if (payload.id) {
			updatePuesto(payload);
		} else {
			addPuesto(payload);
		}
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
		{#if puesto}
			<div
				class="modal"
				onclick={(e) => e.stopPropagation()}
				role="presentation"
			>
				<h2 class="modal-title">{puesto?.id ? 'Editar Puesto' : 'Agregar Nuevo Puesto'}</h2>
				<form class="modal-form"
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
				>
					<label class="modal-label" for="name">Nombre</label>
					<input class="modal-input" id="name" type="text" bind:value={puesto.name} required />

					<label class="modal-label" for="location">Ubicacion</label>
					<input class="modal-input" id="location" type="text" bind:value={puesto.location} required />

					<label class="modal-label" for="prohibited-percentage">Porcentaje prohibido</label>
					<input
						class="modal-input"
						id="prohibited-percentage"
						type="number"
						min="0"
						max="100"
						step="0.01"
						bind:value={puesto.prohibited_percentage}
					/>

					<div class="modal-actions">
						<button type="button" onclick={onClose} >Cancelar</button>
						<button type="submit">Guardar</button>
					</div>
				</form>
			</div>
		{/if}
	</div>
{/if}
