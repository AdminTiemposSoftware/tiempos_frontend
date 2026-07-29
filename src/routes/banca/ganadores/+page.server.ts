import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, url, cookies }) => {
    const baseUrl = env.API_URL;
    const bankingId = locals.user?.bankingId;
    const token = cookies.get('session_banca')
    

    if (!baseUrl || !bankingId) {
        return { items: [] };
    }

    try {
        const response = await fetch(`${baseUrl}/position/by-banking/${bankingId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-App': 'banca',
                Authorization: `Bearer ${token}`
            }
        });

        const payload = response.ok ? await response.json().catch(() => null) : null;

        const items = Array.isArray(payload?.items) ? payload.items : [];

        return { items };
    } catch {
        return { items: [] };
    }
};