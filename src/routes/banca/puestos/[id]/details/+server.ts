import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, cookies, fetch, locals }) => {
    const baseUrl = env.API_URL;
    const bankingId = locals.user?.bankingId;
    const token = cookies.get('session_banca');

    if (!baseUrl || !bankingId) {
        return json({ error: 'Failed to fetch data from the API' }, { status: 500 });
    }

    try {
        const [users, sorteos] = await Promise.all([
            fetch(`${baseUrl}/user/by-branch/${params.id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'X-Auth-App': 'banca'
                }
            }),
            fetch(`${baseUrl}/draw-schedule/by-branch/${params.id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'X-Auth-App': 'banca'
                }
            })
        ]);

        const usersPayload = await users.json().catch(() => null);
        const drawPayload = await sorteos.json().catch(() => null);

        const usersItems = Array.isArray(usersPayload?.items) ? usersPayload.items : [];
        const drawItems = Array.isArray(drawPayload?.items) ? drawPayload.items : [];
            
        return json({ success: true, usersItems, drawItems });
    } catch {
        return json({ error: 'Failed to fetch data from the API' }, { status: 500 });
    }
};