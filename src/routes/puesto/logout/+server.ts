import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? '';

export const POST: RequestHandler = async ({ cookies, fetch }) => {
	const token = cookies.get('session_puesto') ?? '';

	if (API_URL) {
		try {
			await fetch(`${API_URL}/auth/logout`, {
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}`, 'X-Auth-App': 'puesto' } : undefined
			});
		} catch (error) {
			console.error('Logout API call failed.', error);
		}
	}

	cookies.delete('session_puesto', { path: '/puesto' });
	throw redirect(303, '/puesto/login');
};
