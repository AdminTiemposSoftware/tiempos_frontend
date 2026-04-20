<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();

	let hasFormError = $derived(Boolean(form?.error));
</script>

<svelte:head>
	<title>Iniciar sesión</title>
</svelte:head>

<section class="login">
	<div class="login-card">
		<header>
			<h1>Iniciar sesión</h1>
			<p>Ingresa tus credenciales para continuar.</p>
		</header>

		{#if hasFormError}
			<div class="form-error" role="alert">{form?.error}</div>
		{/if}

		<form method="POST" action="/login" use:enhance>
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
				{#if form?.fieldErrors?.password}
					<p id="password-error" class="field-error">{form.fieldErrors.password}</p>
				{/if}
			</div>

			<button type="submit" class="wide">Iniciar sesión</button>
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

	.form-error {
		background: #fdeceb;
		color: #b42318;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		border: 1px solid #f3b4af;
		font-size: 0.9rem;
	}

	.wide {
		width: 100%;
	}
</style>