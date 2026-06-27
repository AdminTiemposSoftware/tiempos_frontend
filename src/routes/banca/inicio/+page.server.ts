import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, cookies }) => {
    const baseUrl = env.API_URL;
    const token = cookies.get('session_banca');
    const bankingId = locals.user?.bankingId;

    if (!baseUrl || !bankingId) {
        return { prohibitedItems: [], reportTodayItems: [], branchNames: [], scheduleNames: [] };
    }

    try {
        const prohibitedResponse = await fetch(`${baseUrl}/number/prohibited/by-banking/${bankingId}`,
            { headers: { 
                Authorization: `Bearer ${token}`, 
                'X-Auth-App': 'banca'
            } }
        );
        const prohibitedPayload = prohibitedResponse.ok ? await prohibitedResponse.json().catch(() => null) : null;
        const prohibitedItems = Array.isArray(prohibitedPayload?.items) ? prohibitedPayload.items : [];

        const reportTodayResponse = await fetch(`${baseUrl}/report/today/${bankingId}`, {
            headers: { 
                Authorization: `Bearer ${token}`, 
                'X-Auth-App': 'banca'
            } }
        );
        const reportTodayPayload = reportTodayResponse.ok ? await reportTodayResponse.json().catch(() => null) : null;
        const reportTodayItems = Array.isArray(reportTodayPayload?.items) ? reportTodayPayload.items : [];

        const branchNamesResponse = await fetch(`${baseUrl}/branch/names/${bankingId}`, {
            headers: { 
                Authorization: `Bearer ${token}`, 
                'X-Auth-App': 'banca'
            } }
        );
        const branchNamesPayload = branchNamesResponse.ok ? await branchNamesResponse.json().catch(() => null) : null;
        const branchNames = Array.isArray(branchNamesPayload?.items) ? branchNamesPayload.items : [];

        const scheduleNamesResponse = await fetch(`${baseUrl}/draw-schedule/names/${bankingId}`, {
            headers: { 
                Authorization: `Bearer ${token}`, 
                'X-Auth-App': 'banca'
            } }
        );
        const scheduleNamesPayload = scheduleNamesResponse.ok ? await scheduleNamesResponse.json().catch(() => null) : null;
        const scheduleNames = Array.isArray(scheduleNamesPayload?.items) ? scheduleNamesPayload.items : [];

        return { prohibitedItems, reportTodayItems, branchNames, scheduleNames };
    } catch {
        return { prohibitedItems: [], reportTodayItems: [], branchNames: [], scheduleNames: [] };
    }
};