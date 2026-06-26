import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch, locals, cookies }) => {
    const baseUrl = env.API_URL;
	const bankingId = locals.user?.bankingId;
	const token = cookies.get('session_banca') ?? null;

	if (!baseUrl || !bankingId) {
		return new Response(JSON.stringify({ error: 'Missing API_URL or bankingId.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

    const payload = await request.json().catch(() => null);
    const dateFrom = payload?.date_from;
    const dateTo = payload?.date_to;
    const branches = payload?.branches;
    const drawSchedules = payload?.draw_schedules;

    if (!dateFrom || !dateTo || !branches || !drawSchedules) {
        return new Response(JSON.stringify({ error: 'Payload must include date_from, date_to, branches, and draw_schedules.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const response = await fetch(`${baseUrl}/report/filtered`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Auth-App': 'banca' },
        body: JSON.stringify({
            date_from: dateFrom,
            date_to: dateTo,
            branches,
            draw_schedules: drawSchedules
        })
    });

    const responsePayload = await response.json().catch(() => null);

    return new Response(JSON.stringify(responsePayload ?? { items: [] }), {
        status: response.ok ? 200 : response.status,
        headers: { 'Content-Type': 'application/json' }
    });
}