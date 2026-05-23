<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
		
	function enhanced (){
		return async ({ result, update }) => {
			loading = false;

			if (result.type === 'failure') {
				error = result.data?.error ?? 'Usuario o contraseña inválidos';
			}

			await update();
		};
	};
</script>

<svelte:head>
	<title>Iniciar sesión</title>
</svelte:head>

<section class="login">
	<div class="login-card">
		<header>
			<h1>Iniciar sesión</h1>
		</header>

		<form method="POST" use:enhance={()=>{
			loading = true;
			error = null;
	
			return enhanced();
		}}>
			<div class="field">
				<label for="username">Usuario</label>
				<input
					id="username"
					type="username"
					name="username"
					autocomplete="username"
					required
					value={form?.values?.username ?? ''}
					aria-invalid={form?.fieldErrors?.username ? 'true' : 'false'}
					aria-describedby={form?.fieldErrors?.username ? 'username-error' : undefined}
				/>
				{#if form?.fieldErrors?.username}
					<p id="username-error" class="field-error">{form.fieldErrors.username}</p>
				{/if}
			</div>

			<div class="field">
				<label for="password">Contraseña</label>
				<input
					id="password"
					type="password"
					name="password"
					placeholder="Tu contraseña"
					autocomplete="current-password"
					required
					aria-invalid={form?.fieldErrors?.password ? 'true' : 'false'}
					aria-describedby={form?.fieldErrors?.password ? 'password-error' : undefined}
				/>
			</div>

			<button type="submit" class="wide" disabled={loading} aria-live="polite">
				{#if loading}
					<span>Iniciando...</span>
					<span class="spinner" aria-hidden="true"></span>
				{:else}
					Iniciar sesión
				{/if}
			</button>

			{#if error}
				<p class="field-error" role="alert">{error}</p>
			{/if}
		</form>
	</div>
</section>

<style>
	.login {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem 1rem;
		box-sizing: border-box;
	}

	.login-card {
		width: min(420px, 100%);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		background: #fff;
		padding: 2rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.login-card header {
		padding: 0;
		border: none;
		background: transparent;
		gap: 0.35rem;
	}

	.login-card p {
		margin: 0;
		color: rgba(0, 0, 0, 0.6);
		font-size: 0.95rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.field-error {
		margin: 0;
		color: #b42318;
		font-size: 0.85rem;
	}

	.wide {
		width: 100%;
	}

	.spinner {
		display: inline-block;
		width: 16px;
		height: 16px;
		margin-left: 0.6rem;
		border: 2px solid rgba(255,255,255,0.45);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 700ms linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>