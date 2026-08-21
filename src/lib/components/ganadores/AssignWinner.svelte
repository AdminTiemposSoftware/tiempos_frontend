<script lang="ts">
	let {
		assignWinner,
		position,
	} = $props();

	let winnerNumber: number | null = $state(position?.winner_number);
	let reventadoColor: 'red' | 'white' | null = $state(null);
	let megaReventadoNumber: number | null = $state(null);


	function canSave() {
	    if (position?.draw_is_reventado){
			if (position?.draw_is_megareventado)
				return reventadoColor !== null && winnerNumber !== null && megaReventadoNumber !== null;
			return reventadoColor !== null && winnerNumber !== null;}
		else
			return winnerNumber !== null;
	}
</script>

<div class="winner-inputs row">
  		<label for="winner-number">Número ganador</label>
  		<input
 			id="winner-number"
 			type="number"
 			min="0"
 			max="90"
 			bind:value={winnerNumber}
  		/>
   	{#if position?.draw_is_reventado}
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
   	{#if position?.draw_is_megareventado}
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
    {#if !position.winner_number}
        <button type="button" class="save" onclick={() => assignWinner(position, winnerNumber, reventadoColor, megaReventadoNumber)} disabled={!canSave()}>
      		Guardar
       	</button>
    {/if}
</div>

<style>
.winner-inputs {
    display: flex;
    flex-direction: row;
	gap: 1rem;
	justify-content: space-around;
	margin-left: auto;
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

.save {
	padding: 0.3rem 0.7rem ;
}
</style>
