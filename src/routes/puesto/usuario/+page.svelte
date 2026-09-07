<script lang="ts">
	import { auth } from '$lib/stores/auth';
	let { data } = $props();

	type AvailableBet = {
        draw_schedule_branch_id: number;
        comission: string | number;
        schedule_id: number;
        schedule_name: string;
        schedule_time: string;
        draw_id: number;
        draw_name: string;
        draw_is_reventado: boolean;
        draw_is_megareventado: boolean;
        days: string[];
        positions: Record<number, number>;
    };

	type DrawGroup = {
		draw_id: number;
		draw_name: string;
		schedules: AvailableBet[];
		days: string[];
	};

    let availableBets = $state<AvailableBet[]>([]);
	let drawGroups = $state<DrawGroup[]>([]);

	$effect(() => {
        const items = Array.isArray(data?.drawItems) ? (data.drawItems as {
            draw_schedule_branch_id: number;
            comission: string | number;
            schedule_id: number;
            schedule_name: string;
            schedule_time: string;
            draw_id: number;
            draw_name: string;
            draw_is_reventado: boolean;
            draw_is_megareventado: boolean;
            day_name?: string | null;
            position_number: number | string;
            days?: string[];
            multiplier: number | null;
        }[]) : [];

        const mappedBets = Object.values(
            items.reduce((acc, item) => {
                if (!acc[item.schedule_id]) {
                    acc[item.schedule_id] = {
                        draw_schedule_branch_id: item.draw_schedule_branch_id,
                        comission: item.comission,
                        schedule_id: item.schedule_id,
                        schedule_name: item.schedule_name,
                        schedule_time: item.schedule_time?.slice(0, 5) ?? 'No disponible',
                        draw_id: item.draw_id,
                        draw_name: item.draw_name,
                        draw_is_reventado: item.draw_is_reventado,
                        draw_is_megareventado: item.draw_is_megareventado,
                        days: [],
                        positions: {}
                    };
                }
                const positionNumber = Number(item.position_number);
                const existingPosition = acc[item.schedule_id].positions[positionNumber];

                if (!existingPosition) {
                    acc[item.schedule_id].positions[positionNumber] = item.multiplier ?? 0;
                }

                const itemDays = [
                    ...(Array.isArray(item.days) ? item.days : []),
                    ...(item.day_name ? [item.day_name] : [])
                ];

                for (const day of itemDays) {
                    if (day && !acc[item.schedule_id].days.includes(day)) {
                        acc[item.schedule_id].days.push(day);
                    }
                }

            return acc;
        }, {} as Record<number, AvailableBet>));
        availableBets = mappedBets;

		const groupedBets = Object.values(
			mappedBets.reduce((groups, bet) => {
				if (!groups[bet.draw_id]) {
					groups[bet.draw_id] = {
						draw_id: bet.draw_id,
						draw_name: bet.draw_name,
						schedules: [],
						days: []
					};
				}

				groups[bet.draw_id].schedules.push(bet);
				for (const day of bet.days) {
					if (!groups[bet.draw_id].days.includes(day)) {
						groups[bet.draw_id].days.push(day);
					}
				}
				return groups;
			}, {} as Record<number, DrawGroup>)
		);

		drawGroups = groupedBets;
    });

	const formatValue = (value: string | number | null | undefined) =>
		value === null || value === undefined || value === '' ? 'No disponible' : String(value);
</script>

<svelte:head>
	<title>Información del usuario</title>
</svelte:head>

<section class="page">
	<article class="card branch-card">
	<h1>Mi información</h1>
	<div class="card-header">
		<p class="eyebrow">Usuario</p>
		<h2>{formatValue($auth.user?.username)}</h2>
		<p class="eyebrow">Puesto asignado</p>
		<h2>{formatValue($auth.user?.branchName)}</h2>
		<p class="label">Ubicación</p>
		<h2>{formatValue($auth.user?.branchLocation)}</h2>
		<p class="label">Porcentaje de prohibidos</p>
		<h2>{formatValue($auth.user?.prohibitedPercentage)}%</h2>
	</div>

	<div class="details">
		<div>
		</div>
	</div>

	<div class="prohibited">
		<div class="subheading">
			<div>
				<h3>Números prohibidos</h3>
			</div>
		</div>

		{#if data?.prohibitedItems?.length > 0}
			<div class="number-list">
				{#each data.prohibitedItems as item}
					<span class="prohibited-badge">
						{formatValue(item.number)}
					</span>
				{/each}
			</div>
		{:else}
			<p class="empty">No hay números prohibidos registrados.</p>
		{/if}
	</div>
	</article>

	<article class="card">

	<h1>Sorteos asignados</h1>
	{#if drawGroups.length > 0}
		<div class="mapped-list">
			{#each drawGroups as draw (draw.draw_id)}
				<div class="draw-group">
					<div class="draw-heading">
						<h3>{formatValue(draw.draw_name)}</h3>
						<div class="chip-row">
							{#if draw.days.length > 0}
								{#each draw.days as day (day)}
									<span class="chip chip--muted">{day}</span>
								{/each}
							{:else}
								<span class="chip">No disponible</span>
							{/if}
						</div>
					</div>
					{#each draw.schedules as bet (bet.schedule_id)}
						<div class="mapped-item">
							<strong>{formatValue(bet.schedule_name)}</strong>
							<span>Hora de cierre: {formatValue(bet.schedule_time)}</span>
							<span>
								{#if bet.positions[1]}
									El primero paga al {bet.positions[1]}
								{:else}
									No disponible
								{/if}
							</span>
							<span>Tu comisión: {formatValue(bet.comission)}%</span>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{:else}
		<p class="empty">No hay horarios asignados para este puesto.</p>
	{/if}
	</article>
</section>

<style>
	.page {
	    display: flex;
	    flex-direction: row;
		gap: 1rem;
		align-items: flex-start;
		width: 100%;
	}

	.card {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		background: #fff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		padding: 1rem;
		height: 95vh;
		overflow: hidden;
	}

	.branch-card {
		width: 50%;
	}

	.card-header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem;
		border-bottom: 1px solid var(--color-border);
		border-top: 1px solid var(--color-border);
	}

	.card h1 {
	text-align: start;
		font-size: 1.7rem;
	}

	.card h2 {
		color: rgba(0, 0, 0, 0.85);
		margin-top: -1rem;
		font-size: 1.25rem;
	}

	.card h3 {
		margin: 0;
		font-size: 1.1rem;
	}

	.mapped-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 0.75rem;
		border-top: 1px solid var(--color-border);
		padding: 1rem;
		max-height: 90vh;
		overflow: auto;
	}

	.draw-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
	}

	.draw-group h3 {
		margin: 0;
		color: rgba(0, 0, 0, 0.85);
	}

	.draw-heading {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.mapped-item {
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.85rem 1rem;
		background: var(--color-box-background);
	}

	.mapped-item > strong {
		color: rgba(0, 0, 0, 0.85);
	}

	.mapped-item > span {
		color: rgba(0, 0, 0, 0.6);
		font-size: 0.9rem;
	}

	.prohibited {
	    margin-top: 1rem;
	}

	.number-list {
		gap: 0.25rem;
		display: flex;
		flex-wrap: wrap;
	}
</style>
