import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, locals, url, cookies }) => {
	const baseUrl = env.API_URL;
	const bankingId = locals.user?.bankingId;
	const token = cookies.get('session_banca') ?? '';
	const dateFrom = url.searchParams.get('date_from');
	const dateTo = url.searchParams.get('date_to');
	const drawSchedules = url.searchParams.get('draw_schedules');

	if (!baseUrl || !bankingId) {
		return new Response(JSON.stringify({ error: 'Missing API_URL or bankingId.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	if (!dateFrom || !dateTo || !drawSchedules) {
		return new Response(
			JSON.stringify({ error: 'Payload must include date_from, date_to, and draw_schedules.' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}

	const query = new URLSearchParams({
		date_from: dateFrom,
		date_to: dateTo,
		draw_schedules: drawSchedules
	});
	const response = await fetch(`${baseUrl}/winner/ticket/filtered?${query}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			'X-Auth-App': 'banca'
		}
	});

	const payload = await response.json().catch(() => null);
	return new Response(JSON.stringify(payload ?? { items: [] }), {
		status: response.ok ? 200 : response.status,
		headers: { 'Content-Type': 'application/json' }
	});
};
