import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, cookies }) => {
    const baseUrl = env.API_URL;
    const token = cookies.get('session_banca');
    const bankingId = locals.user?.bankingId;

    if (!baseUrl || !bankingId) {
        return { prohibitedItems: [], reportTodayItems: [] };
    }

    try {
        const prohibitedResponse = await fetch(`${baseUrl}/number/prohibited/by-banking/${bankingId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const prohibitedPayload = prohibitedResponse.ok ? await prohibitedResponse.json().catch(() => null) : null;
        const prohibitedItems = Array.isArray(prohibitedPayload?.items) ? prohibitedPayload.items : [];

        const reportTodayResponse = await fetch(`${baseUrl}/report/today/${bankingId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const reportTodayPayload = reportTodayResponse.ok ? await reportTodayResponse.json().catch(() => null) : null;
        const reportTodayItems = Array.isArray(reportTodayPayload?.items) ? reportTodayPayload.items : [];
        return { prohibitedItems, reportTodayItems };
    } catch {
        return { prohibitedItems: [], reportTodayItems: [] };
    }
};