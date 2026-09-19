import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const jsonHeaders = {
	'Content-Type': 'application/json',
	'X-Auth-App': 'banca'
};

function apiHeaders(token: string | undefined) {
	return {
		...jsonHeaders,
		...(token ? { Authorization: `Bearer ${token}` } : {})
	};
}

export const GET: RequestHandler = async ({ url, fetch, cookies }) => {
	const baseUrl = env.API_URL;
	const token = cookies.get('session_banca');
	const drawScheduleId = url.searchParams.get('draw_schedule_id');
	const branchId = url.searchParams.get('branch_id');
	const date = url.searchParams.get('date');
	const isReventado = url.searchParams.get('is_reventado');
	const isMegareventado = url.searchParams.get('is_megareventado');

	if (!baseUrl) {
		return json({ error: 'Missing API_URL.' }, { status: 500 });
	}

	if (!drawScheduleId || !branchId || !date || !isReventado || !isMegareventado) {
		return json(
			{error: 'Query parameters draw_schedule_id, branch_id, date, is_reventado, and is_megareventado are required.'},
			{ status: 400 }
		);
	}

	const response = await fetch(
		`${baseUrl}/number/registry/${encodeURIComponent(drawScheduleId)}/${encodeURIComponent(branchId)}/${encodeURIComponent(date)}/${encodeURIComponent(isReventado)}/${encodeURIComponent(isMegareventado)}`,
		{
			method: 'GET',
			headers: apiHeaders(token)
		}
	);
	const responseBody = await response.json().catch(() => null);

	return json(responseBody ?? { items: [] }, { status: response.ok ? 200 : response.status });
};

export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
	const baseUrl = env.API_URL;
	const token = cookies.get('session_banca');

	if (!baseUrl) {
		return json({ error: 'Missing API_URL.' }, { status: 500 });
	}

	const payload = await request.json().catch(() => null);
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
		return json({ error: 'Invalid JSON payload.' }, { status: 400 });
	}

	const body = payload as Record<string, unknown>;
	const requiredFields = [
		'draw_schedule_id',
		'date',
		'branch_id',
		'is_reventado',
		'is_megareventado',
		'numbers'
	];

	if (requiredFields.some((field) => body[field] === undefined || body[field] === null)) {
		return json({ error: 'The registry payload is missing required fields.' }, { status: 400 });
	}

	if (!Array.isArray(body.numbers) || body.numbers.length !== 100) {
		return json({ error: 'numbers must contain exactly 100 items.' }, { status: 400 });
	}

	const response = await fetch(`${baseUrl}/number/registry`, {
		method: 'POST',
		headers: apiHeaders(token),
		body: JSON.stringify(body)
	});
	const responseBody = await response.json().catch(() => null);

	return json(responseBody ?? { items: [] }, { status: response.ok ? 200 : response.status });
};
