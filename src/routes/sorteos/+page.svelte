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
	<div class="sorteos-header">
		<div>
			<h1>Sorteos</h1>
			<p>Gestiona horarios y puestos por sorteo.</p>
		</div>
		<button onclick={() => handleAddSchedule(0)}>
			Nuevo sorteo
		</button>
	</div>
	{#each sorteos as sorteo}
		<div class="sorteo">
			<button class="sorteo-toggle" onclick={() => toggleSorteo(sorteo.id)}>
				<div class="sorteo-main">
					<span class="sorteo-name">{sorteo.name}</span>
					<div class="chips">
						<span class="chip">{sorteo.type}</span>
						<span class="chip muted">{sorteo.days}</span>
					</div>
				</div>
				<span class="count">{sorteo.schedule.length} horarios</span>
			</button>
			{#if expandedSorteo.includes(sorteo.id)}
				<div class="sorteo-content">
					{#each sorteo.schedule as slot}
						<div class="schedule">
							<button
								class="schedule-toggle"
								onclick={() => toggleSchedule(sorteo.id, slot.id)}
							>
								<div class="schedule-main">
									<span class="schedule-name">{slot.name}</span>
									<span class="schedule-time">{slot.time}</span>
								</div>
								<span class="count">{slot.puestos.length} puestos</span>
							</button>
							{#if isScheduleExpanded(sorteo.id, slot.id)}
							<div class="table-wrap">
								<table>
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
							</div>
							{/if}
						</div>
					{/each}
					<div class="actions">
						<button class="add-schedule" onclick={() => handleAddSchedule(sorteo.id)}>
							Agregar horario
						</button>
					</div>
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
	.sorteos-header {
		width: 100%;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
	}
	.sorteos-header h1 {
		margin: 0;
		text-align: left;
	}
	.sorteos-header p {
		color: rgba(0, 0, 0, 0.6);
		font-size: 0.95rem;
	}
	.sorteo {
		width: 100%;
		border: 1px solid var(--color-border);
		border-radius: 0.9rem;
		overflow: hidden;
		background: #fafafa;
	}
	.sorteo-toggle {
		width: 100%;
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border: none;
		cursor: pointer;
		background: #fafafa;
	}
	.sorteo-main {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.sorteo-name {
		font-size: 1.25rem;
		color: rgba(0, 0, 0, 0.85);
	}
	.chips {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.chip {
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		background: var(--color-bg-2);
		font-size: 0.9rem;
		color: rgba(0, 0, 0, 0.7);
		font-weight: 600;
	}
	.chip.muted {
		background: #eaeaea;
		color: rgba(0, 0, 0, 0.55);
		font-weight: 500;
	}
	.count {
		color: rgba(0, 0, 0, 0.55);
		font-weight: 500;
		margin: 0;
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
		gap: 0.4rem;
		background: #fff;
		border: 1px solid var(--color-border);
	}
	.schedule-toggle {
		padding: 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-radius: 0.5rem;
		cursor: pointer;
		text-align: left;
		color: rgba(0, 0, 0, 0.85);
		background: transparent;
	}
	.schedule-main {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.schedule-name {
		font-size: 1.1rem;
		font-weight: 600;
	}
	.schedule-time {
		font-size: 0.8rem;
		color: rgba(0, 0, 0, 0.6);
	}
	.empty-row {
		text-align: center;
	}
	.add-schedule {
		align-self: flex-start;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		cursor: pointer;
	}
	.table-wrap {
		margin: 0 1rem 1rem;
	}
</style>


