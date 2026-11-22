import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

async function forward(
	request: Request,
	method: 'POST' | 'PUT',
	fetch: typeof globalThis.fetch,
	branchId: string | null | undefined,
	token: string
) {
	if (!env.API_URL || !branchId || !token) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const response = await fetch(`${env.API_URL}/amount/`, {
		method,
		headers: {
			'Content-Type': 'application/json',
			Authorization: 'Bearer ' + token,
			'X-Auth-App': 'puesto'
		},
		body: JSON.stringify({ ...body, branch_id: Number(branchId) })
	});
	const payload = await response.json().catch(() => ({ error: 'Invalid API response' }));

	return new Response(JSON.stringify(payload), {
		status: response.status,
		headers: { 'Content-Type': 'application/json' }
	});
}

export const POST: RequestHandler = ({ request, fetch, locals, cookies }) =>
	forward(request, 'POST', fetch, locals.user?.branchId, cookies.get('session_puesto') ?? '');

export const PUT: RequestHandler = ({ request, fetch, locals, cookies }) =>
	forward(request, 'PUT', fetch, locals.user?.branchId, cookies.get('session_puesto') ?? '');
