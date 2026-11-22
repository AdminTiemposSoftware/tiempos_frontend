import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, fetch, locals, cookies }) => {
	const branchId = locals.user?.branchId;
	const token = cookies.get('session_puesto') ?? '';

	if (!env.API_URL || !branchId || !token) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	const response = await fetch(
		`${env.API_URL}/amount/${(params.id)}`,
		{
			method: 'DELETE',
			headers: {
				Authorization: 'Bearer ' + token,
				'X-Auth-App': 'puesto'
			}
		}
	);
	const payload = await response.json().catch(() => ({ items: [] }));

	return new Response(JSON.stringify(payload), {
		status: response.status,
		headers: { 'Content-Type': 'application/json' }
	});
};
