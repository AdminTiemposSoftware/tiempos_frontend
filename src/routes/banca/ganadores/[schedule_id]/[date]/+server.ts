import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, locals, cookies, params }) => {
    const baseUrl = env.API_URL;
    const bankingId = locals.user?.bankingId;
    const token = cookies.get('session_banca');
    const { schedule_id, date } = params;

    if (!baseUrl || !bankingId) {
        return new Response(JSON.stringify({ error: 'Missing API_URL or bankingId.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const response = await fetch(`${baseUrl}/winner/by-schedule/${schedule_id}/${date}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Auth-App': 'banca'
        }
    });

    const responsePayload = await response.json().catch(() => null);

    return new Response(JSON.stringify(responsePayload ?? { error: 'Unknown error occurred.' }), {
        status: response.ok ? 200 : response.status,
        headers: { 'Content-Type': 'application/json' }
    });
}
