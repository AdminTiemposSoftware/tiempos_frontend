import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions } from './$types';

const API_URL = env.API_URL ?? '';

async function readResponsePayload(response: Response) {
	try {
		return await response.json();
	} catch {
		return null;
	}
}

export const actions: Actions = {
	default: async ({ request, cookies }: import('@sveltejs/kit').RequestEvent) => {
		let username = '';
		let password = '';

		try {
			const data = await request.formData();
			username = String(data.get('username') ?? '').trim();
			password = String(data.get('password') ?? '').trim();

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

			const response = await fetch(`${API_URL}/auth/puesto/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username, password })
			});

			const payload = await readResponsePayload(response);

			if (!response.ok) {
				const detail = typeof payload?.detail === 'string' ? payload.detail : null;
				const messageByStatus: Record<number, string> = {
					400: detail ?? 'Revisa los datos enviados.',
					401: detail ?? 'Credenciales inválidas.',
					403: detail ?? 'Tu usuario está deshabilitado.',
					500: detail ?? 'No se pudo iniciar sesión en este momento. Intenta de nuevo'
				};

				const fieldErrors: Record<string, string> = {};
				if (response.status === 401) {
					fieldErrors.password = 'Contraseña incorrecta.';
				}
				if (response.status === 403) {
					fieldErrors.username = 'Este usuario no puede iniciar sesión.';
				}

				return fail(response.status, {
					error: messageByStatus[response.status] ?? detail ?? 'No se pudo iniciar sesión.',
					values: { username },
					fieldErrors
				});
			}

			const token = payload?.token;
			if (!token) {
				return fail(500, {
					error: 'La respuesta del servidor no incluyó un token de sesión.',
					values: { username }
				});
			}

			cookies.set('session', token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: request.url.startsWith('https://')
			});

			throw redirect(303, '/puesto/venta');
		} catch (error) {
			if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
				throw error;
			}

			if (error instanceof TypeError) {
				console.error('Error de red al iniciar sesión.', error);
				return fail(503, {
					error: 'No se pudo conectar con el servidor. Intenta de nuevo mas tarde.',
					values: { username }
				});
			}

			console.error('Error de inicio de sesión.', error);
			return fail(500, {
				error: 'Error al iniciar sesión. Intenta de nuevo mas tarde.',
				values: { username }
			});
		}
	}
};
