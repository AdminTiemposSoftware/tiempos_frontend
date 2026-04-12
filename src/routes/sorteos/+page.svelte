<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import PuestoModal from '$lib/components/puestos/PuestoModal.svelte';
	import { PenSolid, TrashBinSolid, EyeSolid } from 'flowbite-svelte-icons';

	let puestosHeaders = [
		{ key: 'time', label: 'Hora' },
		{ key: 'commission', label: 'Comision' },
		{ key: 'merchantName', label: 'Nombre Comercio' },
		{ key: 'normalPayment', label: 'Pago normal' },
		{ key: 'extraPayment', label: 'Pago extra' },
		{ key: 'options', label: 'Opciones' }
	];

	let sorteos = [
		{
			id: 1,
			name: 'Loteria Nacional',
			type: 'Tiempos',
			days: 'Lun, Mar, Mie, Jue, Vie',
			schedule: [
				{
					id: 10,
					name: 'Manana',
					time: '12:00',
					puestos: [
						{
							id: 101,
							merchantName: 'Comercio Central',
							commission: 10,
							commission2: 5,
							normalPayment: 60,
							extraPayment: 90
						}
					]
				},
				{
					id: 12,
					name: 'Noche',
					time: '20:00',
					puestos: [
						{
							id: 102,
							merchantName: 'Punto Norte',
							commission: 12,
							commission2: 6,
							normalPayment: 70,
							extraPayment: 100
						}
					]
				}
			]
		},
		{
			id: 2,
			name: 'Loteria Premium',
			type: 'Reventado',
			days: 'Sab, Dom',
			schedule: [
                {
                    id: 11,
                    name: 'Mañana',
                    time: '18:00',
                    puestos: [
                        {
                            id: 201,
                            merchantName: 'Sucursal Sur',
                            commission: 15,
                            commission2: 7,
                            normalPayment: 80,
                            extraPayment: 120,
                        },
                        {
                            id: 201,
                            merchantName: 'Sucursal Sur',
                            commission: 15,
                            commission2: 7,
                            normalPayment: 80,
                            extraPayment: 120,
                        }
                    ]
                }            
            ]
		}
	];

	let showModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedPuesto = $state(null);
	let puestoToDelete = $state(null);
	let expandedSorteo = $state<number[]>([]);
	let expandedSchedule = $state<Record<number, number[]>>({});

	function handleEdit(puesto) {
		console.log('Editar puesto:', puesto);
		selectedPuesto = puesto;
		showModal = true;
	}

	function handleDelete(puesto) {
		puestoToDelete = puesto;
		showDeleteModal = true;
	}

	function handleConfirmDelete() {
		if (!puestoToDelete) {
			return;
		}
		sorteos = sorteos.map((sorteo) => ({
			...sorteo,
			schedule: sorteo.schedule.map((slot) => ({
				...slot,
				puestos: slot.puestos.filter((puesto) => puesto.id !== puestoToDelete?.id)
			}))
		}));
		puestoToDelete = null;
	}

	function handleAddPuestos(event: CustomEvent) {
	}

	function handleUpdatePuestos(event: CustomEvent) {
		const updated = event.detail;
		sorteos = sorteos.map((sorteo) => ({
			...sorteo,
			schedule: sorteo.schedule.map((slot) => ({
				...slot,
				puestos: slot.puestos.map((puesto) => (puesto.id === updated.id ? updated : puesto))
			}))
		}));
	}

	function handleView(puestos: (typeof sorteos)[number]['schedule'][number]['puestos'][number]) {
		selectedPuesto = puestos;
		showModal = true;
	}

	function toggleSorteo(sorteoId: number) {
		expandedSorteo = expandedSorteo.includes(sorteoId)
			? expandedSorteo.filter((id) => id !== sorteoId)
			: [...expandedSorteo, sorteoId];
	}

	function toggleSchedule(sorteoId: number, scheduleKey: number) {
		expandedSchedule = {
            ...expandedSchedule,
            [sorteoId]: expandedSchedule[sorteoId]?.includes(scheduleKey)
				? expandedSchedule[sorteoId].filter((item) => item !== scheduleKey)
				: [...(expandedSchedule[sorteoId] || []), scheduleKey]
        };
	}

	function handleAddSchedule(sorteoId: number) {
		showModal = true;
		selectedPuesto = null;
	}

	function isScheduleExpanded(sorteoId: number, scheduleKey: number) {
		return expandedSchedule[sorteoId]?.includes(scheduleKey);
	}

	function getTimeClass(time: string) {
		const hour = Number(time.split(':')[0]);
		if (Number.isNaN(hour)) {
			return 'night';
		}
		if (hour >= 0 && hour < 12) {
			return 'morning';
		}
        if (hour >= 12 && hour < 18) {
            return 'afternoon';
		}
		if (hour >= 18 && hour < 24) {
			return 'night';
		}
		return 'night';
	}

</script>

<PuestoModal
	bind:showModal={showModal}
	bind:puesto={selectedPuesto}
	on:addPuesto={handleAddPuestos}
	on:updatePuesto={handleUpdatePuestos}
/>

<ConfirmModal
	bind:showModal={showDeleteModal}
	title="Eliminar sorteo"
	message={`Estas seguro de eliminar ${puestoToDelete?.name ?? 'este sorteo'}?`}
	confirmText="Eliminar"
	cancelText="Cancelar"
	confirm={handleConfirmDelete}
/>

<section class="sorteos-container">
	<h1>Sorteos</h1>
	{#each sorteos as sorteo}
		<div class="sorteo">
			<button class="sorteo-toggle" onclick={() => toggleSorteo(sorteo.id)}>
				<span>{sorteo.name}</span>
				<span>{sorteo.type}</span>
				<span>{sorteo.days}</span>
			</button>
			{#if expandedSorteo.includes(sorteo.id)}
				<div class="sorteo-content">
					{#each sorteo.schedule as slot}
						<div class="schedule">
							<button
								class={`schedule-toggle ${getTimeClass(slot.time)}`}
								onclick={() => toggleSchedule(sorteo.id, slot.id)}
							>
								<span>{slot.name}</span>
								<span>{slot.time}</span>
							</button>
							{#if isScheduleExpanded(sorteo.id, slot.id)}
								<table class="schedule-table">
									<thead>
										<tr>
											{#each puestosHeaders as header}
												<th>{header.label}</th>
											{/each}
										</tr>
									</thead>
									<tbody>
										{#if slot.puestos.length === 0}
											<tr>
												<td colspan={puestosHeaders.length} class="empty-row">
													Sin sorteos
												</td>
											</tr>
										{:else}
											{#each slot.puestos as puesto}
												<tr>
													<td>{slot.time}</td>
													<td>{puesto.commission}%</td>
													<td>{puesto.merchantName}</td>
													<td>{puesto.normalPayment}</td>
													<td>{puesto.extraPayment}</td>
													<td>
														<div class="options-buttons">
															<button class="neutral" onclick={() => handleEdit(puesto)}>
																<PenSolid class="shrink-0 h-4 w-4" />
															</button>
															<button class="negative" onclick={() => handleDelete(puesto)}>
																<TrashBinSolid class="shrink-0 h-4 w-4" />
															</button>
															<button onclick={() => handleView(puesto)}>
																<EyeSolid class="shrink-0 h-4 w-4" />
															</button>
														</div>
													</td>
												</tr>
											{/each}
										{/if}
									</tbody>
								</table>
							{/if}
						</div>
					{/each}
					<button class="add-schedule" onclick={() => handleAddSchedule(sorteo.id)}>
						Agregar horario
					</button>
				</div>
			{/if}
		</div>
	{/each}
</section>

<style>
	.sorteos-container {
		flex-direction: column;
		justify-content: start;
		align-items: start;
		gap: 1rem;
		width: 100%;
	}
	.sorteo {
		width: 100%;
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		overflow: hidden;
	}
	.sorteo-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border: none;
		cursor: pointer;
		text-align: left;
		font-weight: 600;
	}
	.sorteo-content {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.schedule {
		display: flex;
		border-radius: 0.75rem;
		flex-direction: column;
	}
	.schedule-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border);
		cursor: pointer;
		text-align: left;
	}
	.schedule-table {
		width: 100%;
		border-collapse: collapse;
	}
	.schedule-table th,
	.schedule-table td {
		padding: 0.5rem;
		border-bottom: 1px solid var(--color-border);
		text-align: left;
	}
	.empty-row {
		text-align: center;
	}
	.add-puestos {
		align-self: flex-start;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		cursor: pointer;
	}
</style>


