import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, url, cookies }) => {
    const baseUrl = env.API_URL;
    const bankingId = locals.user?.bankingId;
    const token = cookies.get('session_banca')


    if (!baseUrl || !bankingId) {
        return { items: [], scheduleNames: [] };
    }

    try {
	    const selectedDateParam = url.searchParams.get('date');
        const fallbackDate = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().split('T')[0];
        const selectedDate = selectedDateParam ?? fallbackDate;

        const [response] = await Promise.all([fetch(`${baseUrl}/winner/by-banking/${bankingId}/${selectedDate}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-App': 'banca',
                Authorization: `Bearer ${token}`
            }
        })]);

        const payload = response.ok ? await response.json().catch(() => null) : null;
        const items = Array.isArray(payload?.items) ? payload.items : [];

        const scheduleNamesResponse = await fetch(`${baseUrl}/draw-schedule/names/${bankingId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'X-Auth-App': 'banca'
            }
        });
        const scheduleNamesPayload = scheduleNamesResponse.ok ? await scheduleNamesResponse.json().catch(() => null) : null;
        const scheduleNames = Array.isArray(scheduleNamesPayload?.items) ? scheduleNamesPayload.items : [];

        return { items, scheduleNames };
    } catch {
        return { items: [], scheduleNames: [] };
    }
};
