import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ request, fetch, locals, cookies }) => {
    const baseUrl = env.API_URL;
    const bankingId = locals.user?.bankingId;
    const token = cookies.get('session_banca');

    if (!baseUrl || !bankingId) {
        return new Response(JSON.stringify({ error: 'Missing API_URL or bankingId.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const payload = await request.json().catch(() => null);
    const positionId = payload?.id;
    const multiplier = payload?.multiplier;

    if (!positionId || multiplier === undefined) {
        return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const response = await fetch(`${baseUrl}/position`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Auth-App': 'banca'
        },
        body: JSON.stringify({ id: positionId, multiplier })
    });

    const responsePayload = await response.json().catch(() => null);

    return new Response(JSON.stringify(responsePayload ?? { error: 'Unknown error occurred.' }), {
        status: response.ok ? 200 : response.status,
        headers: { 'Content-Type': 'application/json' }
    });
}