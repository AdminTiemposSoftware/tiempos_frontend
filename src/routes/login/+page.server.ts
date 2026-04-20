import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions } from './$types';

const ENV_LOGIN_USERNAME = env.ADMIN_USERNAME ?? '';
const ENV_LOGIN_PASSWORD = env.ADMIN_PASSWORD ?? '';
const ENV_LOGIN_TOKEN = env.PRIVATE_AUTH_TOKEN ?? 'env-login';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
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

			if (username === ENV_LOGIN_USERNAME && password === ENV_LOGIN_PASSWORD) {
				cookies.set('session', ENV_LOGIN_TOKEN, {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: false
				});

				throw redirect(303, '/venta');
			}

			return fail(401, {
				error: 'Credenciales inválidas.',
				values: { username },
				fieldErrors: { password: 'Contraseña incorrecta.' }
			});
		} catch (error) {
			console.error('Error de inicio de sesión.', error);
			return fail(500, {
				error: 'Error al iniciar sesión. Intenta de nuevo.'
			});
		}
	}
};
