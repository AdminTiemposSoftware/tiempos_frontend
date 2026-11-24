import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ fetch, params, cookies }) => {
    const { id } = params;
    const baseUrl = env.API_URL;
    const token = cookies.get('session_banca') ?? null;

    if (!id || !token) {
        return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const response = await fetch(`${baseUrl}/winner/${id}`, {
        method: 'DELETE',
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
