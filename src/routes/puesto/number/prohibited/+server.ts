import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, fetch, locals, cookies }) => {
    const baseUrl = env.API_URL;
	const branchId = locals.user?.branchId;
    const token = cookies.get('session_puesto') ?? null;
    console.log('token', token);
    console.log( 'branchId', branchId);

	if (!baseUrl || !branchId) {
		return new Response(JSON.stringify({ error: 'Missing API_URL or branchId.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

    const url = new URL(request.url);
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');

    if (!dateFrom || !dateTo ) {
        return new Response(JSON.stringify({ error: 'Payload must include date_from and date_to.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const response = await fetch(`${baseUrl}/number/prohibited/filtered?date_from=${dateFrom}&date_to=${dateTo}&branches=${encodeURIComponent(branchId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Auth-App': 'banca' }
    });

    const responsePayload = await response.json().catch(() => null);

    return new Response(JSON.stringify(responsePayload ?? { items: [] }), {
        status: response.ok ? 200 : response.status,
        headers: { 'Content-Type': 'application/json' }
    });
}
