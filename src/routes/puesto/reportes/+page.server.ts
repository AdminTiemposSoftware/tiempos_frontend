import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, cookies }) => {
    const baseUrl = env.API_URL;
    const token = cookies.get('session_puesto');
    const branchId = locals.user?.branchId;

    if (!baseUrl || !branchId) {
        return { prohibitedItems: [], reportTodayItems: [], scheduleNames: [] };
    }

    try {
        const prohibitedResponse = await fetch(`${baseUrl}/number/prohibited/by-branch/${branchId}`,
            { headers: {
                Authorization: `Bearer ${token}`,
                'X-Auth-App': 'banca'
            } }
        );
        const prohibitedPayload = prohibitedResponse.ok ? await prohibitedResponse.json().catch(() => null) : null;
        const prohibitedItems = Array.isArray(prohibitedPayload?.items) ? prohibitedPayload.items : [];

        const scheduleNamesResponse = await fetch(`${baseUrl}/draw-schedule/by-branch/${branchId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'X-Auth-App': 'banca'
            } }
        );
        const scheduleNamesPayload = scheduleNamesResponse.ok ? await scheduleNamesResponse.json().catch(() => null) : null;
        const scheduleNames = Array.isArray(scheduleNamesPayload?.items) ? scheduleNamesPayload.items : [];

        // Extract ids from schedule
        const scheduleIds = scheduleNames.map((schedule: any) => schedule.draw_schedule_id);
        const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().split('T')[0];

        const date_from = utcMinus6Date;
        const date_to = utcMinus6Date;

        const reportTodayResponse = await fetch(`${baseUrl}/report/filtered?date_from=${date_from}&date_to=${date_to}&branches=${branchId}&draw_schedules=${encodeURIComponent(scheduleIds.join(','))}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'X-Auth-App': 'banca'
            } }
        );
        const reportTodayPayload = reportTodayResponse.ok ? await reportTodayResponse.json().catch(() => null) : null;
        const reportTodayItems = Array.isArray(reportTodayPayload?.items) ? reportTodayPayload.items : [];

        return { prohibitedItems, reportTodayItems, scheduleNames };
    } catch {
        return { prohibitedItems: [], reportTodayItems: [], scheduleNames: [] };
    }
};
