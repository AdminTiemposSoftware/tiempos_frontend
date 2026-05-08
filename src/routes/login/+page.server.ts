import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions } from './$types';

const API_URL = env.API_URL ?? '';

	export const actions: Actions = {
	default: async ({ request, cookies }: import('@sveltejs/kit').RequestEvent) => {
		try {
			const data = await request.formData();
			const username = String(data.get('username') ?? '').trim();
			const password = String(data.get('password') ?? '').trim();

			const fieldErrors: Record<string, string> = {};
			if (!username) {
				fieldErrors.username = 'El usuario es obligatorio.';
			}
			if (!password) {
				fieldErrors.password = 'La contraseña es obligatoria.';
			}

			if (Object.keys(fieldErrors).length > 0) {
				return fail(400, {
					error: 'Faltan credenciales.',
					values: { username },
					fieldErrors
				});
			}

			if (!API_URL) {
				return fail(500, {
					error: 'Error interno del servidor.'
				});
			}

			const response = await fetch(`${API_URL}/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username, password })
			});

			if (!response.ok) {
				const payload = await response.json().catch(() => null);
				return fail(response.status, {
					error: payload?.detail ?? 'Credenciales inválidas.',
					values: { username },
					fieldErrors: { password: 'Contraseña incorrecta.' }
				});
			}

			const payload = await response.json().catch(() => null);
			const token = payload?.token;
			if (!token) {
				return fail(500, {
					error: 'Token de sesión no recibido.'
				});
			}

			cookies.set('session', token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: request.url.startsWith('https://')
			});

			throw redirect(303, '/venta');
		} catch (error) {
			if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
				throw error;
			}
			console.error('Error de inicio de sesión.', error);
			return fail(500, {
				error: 'Error al iniciar sesión. Intenta de nuevo.'
			});
		}
	}
};
