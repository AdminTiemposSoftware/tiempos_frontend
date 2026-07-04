import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, url, cookies }) => {
    const baseUrl = env.API_URL;
    const branchId = locals.user?.branchId;
    const token = cookies.get('session_puesto');
    

    if (!baseUrl || !branchId) {
        return { items: [] };
    }

    try {
	    const selectedDateParam = url.searchParams.get('date');
        const fallbackDate = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().split('T')[0];
        const selectedDate = selectedDateParam ?? fallbackDate;

        const [response] = await Promise.all([fetch(`${baseUrl}/winner/by-branch/${branchId}/${selectedDate}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-App': 'puesto',
                Authorization: `Bearer ${token}`
            }
        })]);

        const payload = response.ok ? await response.json().catch(() => null) : null;

        const items = Array.isArray(payload?.items) ? payload.items : [];

        return { items };
    } catch {
        return { items: [] };
    }
};