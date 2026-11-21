import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, locals, url, cookies }) => {
	const baseUrl = env.API_URL;
	const bankingId = locals.user?.bankingId;
	const token = cookies.get('session_banca') ?? '';
	const dateFrom = url.searchParams.get('date_from');
	const dateTo = url.searchParams.get('date_to');
	const branches = url.searchParams.get('branches');
	const drawSchedules = url.searchParams.get('draw_schedules');
	const serial = url.searchParams.get('serial');

	if (!baseUrl || !bankingId) {
		return new Response(JSON.stringify({ error: 'Missing API_URL or bankingId.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	if (serial?.trim()) {
		const response = await fetch(
			`${baseUrl}/ticket/by-serial-banking/${encodeURIComponent(bankingId)}/${encodeURIComponent(serial.trim())}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					'X-Auth-App': 'banca'
				}
			}
		);
		const payload = await response.json().catch(() => null);
		return new Response(JSON.stringify(payload ?? { items: [] }), {
			status: response.ok ? 200 : response.status,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	if (!dateFrom || !dateTo || !branches || !drawSchedules) {
		return new Response(
			JSON.stringify({
				error: 'Payload must include date_from, date_to, branches, and draw_schedules.'
			}),
			{ status: 400, headers: { 'Content-Type': 'application/json' } }
		);
	}

	const query = new URLSearchParams({
		date_from: dateFrom,
		date_to: dateTo,
		branches,
		draw_schedules: drawSchedules
	});
	const response = await fetch(`${baseUrl}/ticket/filtered?${query}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			'X-Auth-App': 'banca'
		}
	});

	const payload = await response.json().catch(() => null);
	return new Response(JSON.stringify(payload ?? { items: [], numbers: [] }), {
		status: response.ok ? 200 : response.status,
		headers: { 'Content-Type': 'application/json' }
	});
};
