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
    const positionId = payload?.position_id;
    const number = payload?.number;
    const date = payload?.date;

    if (!positionId || number === undefined || !date) {
        return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const response = await fetch(`${baseUrl}/winner`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Auth-App': 'banca'
        },
        body: JSON.stringify({ position_id: positionId, number, date })
    });

    const responsePayload = await response.json().catch(() => null);

    return new Response(JSON.stringify(responsePayload ?? { error: 'Unknown error occurred.' }), {
        status: response.ok ? 200 : response.status,
        headers: { 'Content-Type': 'application/json' }
    });
}