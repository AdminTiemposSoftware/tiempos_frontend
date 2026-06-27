import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, fetch, locals, cookies }) => {
    const baseUrl = env.API_URL;
	const bankingId = locals.user?.bankingId;
	const token = cookies.get('session_banca') ?? null;

	if (!baseUrl || !bankingId) {
		return new Response(JSON.stringify({ error: 'Missing API_URL or bankingId.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}
    
    const url = new URL(request.url);
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');
    const branches = url.searchParams.get('branches');
    const drawSchedules = url.searchParams.get('draw_schedules');

    console.log('Received parameters:', { dateFrom, dateTo, branches, drawSchedules });
    if (!dateFrom || !dateTo || !branches || !drawSchedules) {
        return new Response(JSON.stringify({ error: 'Payload must include date_from, date_to, branches, and draw_schedules.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const response = await fetch(`${baseUrl}/report/filtered?date_from=${dateFrom}&date_to=${dateTo}&branches=${encodeURIComponent(branches)}&draw_schedules=${encodeURIComponent(drawSchedules)}`, {
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