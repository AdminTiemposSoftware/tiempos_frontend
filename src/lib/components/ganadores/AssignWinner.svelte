<script lang="ts">
	let {
		winnerNumber = $bindable<number | null>(null),
		reventadoColor = $bindable<'red' | 'white' | null>(null),
		megaReventadoNumber = $bindable<number | null>(null),
		showReventado = false,
		showMegareventado = false,
		selectedWinner = $bindable(null),
	} = $props();

	function canSave() {
		return winnerNumber !== null && reventadoColor !== null;
	}
</script>

<div class="winner-inputs">
    <div class="inputs-row">
    	<div class="row">
    		<label for="winner-number">Número ganador</label>
    		<input
    			id="winner-number"
    			type="number"
    			min="0"
    			max="90"
    			bind:value={winnerNumber}
    		/>
    	</div>
    	{#if showReventado}
    		<div class="row">
    			<label>Cayó bola </label>
    			<div class="color-options">
    				{#if reventadoColor !== 'white'}
    					<button
    						type="button"
    						class="color-ball red"
    						class:selected={reventadoColor === 'red'}
    						aria-label="Rojo"
    						onclick={() => (reventadoColor = 'red')}
    					></button>
    				{/if}
    				{#if reventadoColor !== 'red'}
    					<button
    						type="button"
    						class="color-ball white"
    						class:selected={reventadoColor === 'white'}
    						aria-label="Blanco"
    						onclick={() => (reventadoColor = 'white')}
    					></button>
    				{/if}
    			</div>
    		</div>
    	{/if}
    	{#if showMegareventado}
    		<div class="row">
    			<label for="mega-reventado-number">Número megareventado</label>
    			<input
    				id="mega-reventado-number"
    				type="number"
    				min="0"
    				max="90"
    				bind:value={megaReventadoNumber}
    			/>
    		</div>
    	{/if}
    </div>
	<button type="button" class="save" disabled={!canSave()}>
		Guardar
	</button>
</div>

<style>
.winner-inputs {
    display: flex;
    flex-direction: column;
	gap: 1rem;
	justify-content: space-around;
	flex: 1;
}

.inputs-row {
	display: flex;
	flex-direction: row;
	width: 100%;
	justify-content: space-around;
}

.color-options {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	min-height: 42px;
}

.color-ball {
	width: 36px;
	height: 36px;
	padding: 0;
	border-radius: 50%;
	border: 2px solid #d1d5db;
	cursor: pointer;
	transition:
		transform 0.15s ease,
		opacity 0.15s ease,
		border-color 0.15s ease;
}

.color-ball:hover {
	transform: scale(1.08);
}

.color-ball.red {
	background: #ef4444;
}

.color-ball.white {
	background: white;
}

.color-ball.selected {
	border: 3px solid #111827;
	box-shadow: 0 0 0 2px white, 0 0 0 4px #111827;
}
</style>
