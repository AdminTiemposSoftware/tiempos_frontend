import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, fetch, locals, cookies }) => {
	const baseUrl = env.API_URL;
	const branchId = locals.user?.branchId;
	const token = cookies.get('session_puesto') ?? null;
	const params = new URL(request.url).searchParams;
	const dateFrom = params.get('date_from');
	const dateTo = params.get('date_to');
	const drawSchedules = params.get('draw_schedules');

	if (!baseUrl || !branchId || !dateFrom || !dateTo || !drawSchedules) {
		return new Response(JSON.stringify({ error: 'Missing report base parameters.' }), {
			status: 400, headers: { 'Content-Type': 'application/json' }
		});
	}

	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token ?? ''}`,
		'X-Auth-App': 'puesto'
	};
	const query = `date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}&branches=${encodeURIComponent(branchId)}&draw_schedules=${encodeURIComponent(drawSchedules)}`;
	const response = await fetch(`${baseUrl}/report/base?${query}`, { headers });
	const payload = await response.json().catch(() => null);
	return new Response(JSON.stringify(payload), {
		status: response.status, headers: { 'Content-Type': 'application/json' }
	});
};
