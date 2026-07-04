import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, locals, url, cookies }) => {
    const baseUrl = env.API_URL;
    const branchId = locals.user?.branchId;
    const winnerId = url.searchParams.get('winner_id');
    const token = cookies.get('session_puesto');

    if (!baseUrl || !branchId || !winnerId) {
        return new Response(JSON.stringify({ items: [], details: [] }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const response = await fetch(
        `${baseUrl}/ticket/by-winner/${winnerId}`,
        {
            headers: { 
                Authorization: `Bearer ${token}`, 
                'X-Auth-App': 'puesto' 
            }
        }
    );
    const payload = await response.json().catch(() => null);

    return new Response(JSON.stringify(payload ?? { items: [], details: [] }), {
        status: response.ok ? 200 : response.status,
        headers: { 'Content-Type': 'application/json' }
    });
};
