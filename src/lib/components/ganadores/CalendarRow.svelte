<script lang="ts">
	let {
		selectedDateString = $bindable<string>(),
		existingDates
	} = $props();

	let selectedDate = $state({value: formatDate(new Date()), day: new Date().toLocaleDateString('es-CR', { weekday: 'short' }), date: new Date()})

	function formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');

		return `${year}-${month}-${day}`;
	}

	function formatDisplayDate(date: string): string {
		const [year, month, day] = date.split('-');
		const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
		return `${Number(day)} de ${monthNames[Number(month) - 1]} del ${year}`;
	}

	const days = $derived.by(() => {
		const result: { value: string; day: string; date: number }[] = [];

		for (let i = 6; i >= 0; i--) {
			const date = new Date(selectedDate.date);
			date.setDate(date.getDate() - i);

			result.push({
				value: formatDate(date),
				day: date.toLocaleDateString('es-CR', { weekday: 'short' }),
				date: date.getDate()
			});
		}

		return result;
	});

	function moveDays(amount: number) {
		const date = new Date(selectedDate.date);
		date.setDate(date.getDate() + amount);
		selectedDate = { value: formatDate(date), day: date.toLocaleDateString('es-CR', { weekday: 'short' }), date: date };
	}

</script>

<div class="calendar-row">
    <div class="days-row">
        <button
    		type="button"
    		class="arrow"
    		onclick={() => moveDays(-1)}
    		aria-label="Días anteriores"
    	>
    		←
    	</button>
    	{#each days as day}
    		<button
    			type="button"
    			class={`day ${existingDates.includes(day.value) ? 'existing' : ''} ${selectedDate.value === day.value ? 'active' : ''}`}
    			onclick={() => (selectedDate.value = day.value)}
    		>
    			<span>{day.day}</span>
    			<strong>{day.date}</strong>
    		</button>
    	{/each}
    	<button
    		type="button"
    		class="arrow"
    		onclick={() => moveDays(1)}
    		aria-label="Días siguientes"
    	>
    		→
    	</button>
    </div>
    <span>{formatDisplayDate(selectedDate.value)}</span>
    <span class="subtitle">{`${existingDates.includes(selectedDate.value) ? 'Ganador' : 'Aun no se ha asignado en esta fecha'}`}</span>
</div>

<style>
	.calendar-row {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.days-row {
		display: flex;
		justify-content: space-around;
		gap: 0.5rem;
	}

	.day {
		border-radius: 999px;
		flex-direction: column;
		align-items: center;
		gap: 0rem;
		border: 1px solid var(--color-border);
		color: var(--color-text);
		background-color: white;
	}

	.subtitle {
	    margin-top: -1rem;
	}

	.day.existing {
		background-color: auto;
	}

	.day.active {
		border: 2px solid var(--color-border);
	}

	.day span {
		font-size: 0.8rem;
		text-transform: capitalize;
		opacity: 0.7;
	}

	.arrow {
		border: none;
		background-color: transparent;
		color: var(--color-text);

	}
</style>
