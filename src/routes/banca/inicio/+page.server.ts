import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, cookies }) => {
    const baseUrl = env.API_URL;
    const token = cookies.get('session_banca');
    const bankingId = locals.user?.bankingId;

    if (!baseUrl || !bankingId) {
        return {
            prohibitedItems: [],
            reportTodayItems: [],
            winnersFilteredItems: [],
            prohibitedFilteredItems: [],
            branchNames: [],
            scheduleNames: []
        };
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

        const branchIds = branchNames.map((branch: any) => branch.id);
        const scheduleIds = scheduleNames.map((schedule: any) => schedule.draw_schedule_id);
        const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().split('T')[0];

        const reportTodayResponse = await fetch(`${baseUrl}/report/filtered?date_from=${utcMinus6Date}&date_to=${utcMinus6Date}&branches=${encodeURIComponent(branchIds.join(','))}&draw_schedules=${encodeURIComponent(scheduleIds.join(','))}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'X-Auth-App': 'banca'
            } }
        );
        const reportTodayPayload = reportTodayResponse.ok ? await reportTodayResponse.json().catch(() => null) : null;
        const reportTodayItems = Array.isArray(reportTodayPayload?.items) ? reportTodayPayload.items : [];

        const winnersFilteredResponse = await fetch(`${baseUrl}/winner/filtered?date_from=${utcMinus6Date}&date_to=${utcMinus6Date}&branches=${encodeURIComponent(branchIds.join(','))}&draw_schedules=${encodeURIComponent(scheduleIds.join(','))}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'X-Auth-App': 'banca'
            }
        });
        const winnersFilteredPayload = winnersFilteredResponse.ok ? await winnersFilteredResponse.json().catch(() => null) : null;
        const winnersFilteredItems = Array.isArray(winnersFilteredPayload?.items) ? winnersFilteredPayload.items : [];

        const prohibitedFilteredResponse = await fetch(`${baseUrl}/number/prohibited/filtered?date_from=${utcMinus6Date}&date_to=${utcMinus6Date}&branches=${encodeURIComponent(branchIds.join(','))}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'X-Auth-App': 'banca'
            }
        });
        const prohibitedFilteredPayload = prohibitedFilteredResponse.ok ? await prohibitedFilteredResponse.json().catch(() => null) : null;
        const prohibitedFilteredItems = Array.isArray(prohibitedFilteredPayload?.items) ? prohibitedFilteredPayload.items : [];

        return {
            prohibitedItems,
            reportTodayItems,
            winnersFilteredItems,
            prohibitedFilteredItems,
            branchNames,
            scheduleNames
        };
    } catch {
        return {
            prohibitedItems: [],
            reportTodayItems: [],
            winnersFilteredItems: [],
            prohibitedFilteredItems: [],
            branchNames: [],
            scheduleNames: []
        };
    }
};
