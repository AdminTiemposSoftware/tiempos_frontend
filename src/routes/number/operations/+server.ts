import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, fetch, cookies }) => {
    const baseUrl = env.API_URL;
    const token = cookies.get('session_banca');
    const drawScheduleId = url.searchParams.get('draw_schedule_id');
    const branchId = url.searchParams.get('branch_id');
    const date = url.searchParams.get('date');
    const isReventado = url.searchParams.get('is_reventado');
    const isMegareventado = url.searchParams.get('is_megareventado');

    if (!baseUrl) {
        return new Response(JSON.stringify({ error: 'Missing API_URL.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!drawScheduleId || !branchId || !date || !isReventado || !isMegareventado) {
        return new Response(JSON.stringify({
            error: 'Query parameters draw_schedule_id, branch_id, date, is_reventado, and is_megareventado are required.'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const response = await fetch(`${baseUrl}/number/operations/${encodeURIComponent(drawScheduleId)}/${encodeURIComponent(branchId)}/${encodeURIComponent(date)}/${encodeURIComponent(isReventado)}/${encodeURIComponent(isMegareventado)}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-App': 'banca',
                Authorization: `Bearer ${token}`
            },
        }
    );
    const responsePayload = await response.json().catch(() => null);

    return new Response(JSON.stringify(responsePayload ?? { items: [] }), {
        status: response.ok ? 200 : response.status,
        headers: { 'Content-Type': 'application/json' }
    });
};

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
    const operations = payload?.operations;
    const date = payload?.date;

    if (!Array.isArray(operations) || operations.length === 0 || !date) {
        return new Response(JSON.stringify({ error: 'Payload must include date and operations.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const response = await fetch(`${baseUrl}/number/operations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Auth-App': 'banca'
        },
        body: JSON.stringify({ date, operations })
    });
    const responsePayload = await response.json().catch(() => null);

    return new Response(JSON.stringify(responsePayload ?? { error: 'Unknown error occurred.' }), {
        status: response.ok ? 200 : response.status,
        headers: { 'Content-Type': 'application/json' }
    });
};
