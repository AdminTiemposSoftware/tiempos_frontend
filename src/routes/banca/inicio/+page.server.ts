import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, cookies }) => {
    const baseUrl = env.API_URL;
    const token = cookies.get('session_banca');
    const bankingId = locals.user?.bankingId;

    const emptyResult = {
        prohibitedItems: [],
        branchNames: [],
        scheduleNames: [],
        scheduleBranch: []
    };

    if (!baseUrl || !bankingId) {
        return emptyResult;
    }

    const headers = {
        Authorization: `Bearer ${token ?? ''}`,
        'X-Auth-App': 'banca'
    };

    try {
        const [
            prohibitedResponse,
            branchNamesResponse,
            scheduleNamesResponse,
            scheduleBranchResponse
        ] = await Promise.all([
            fetch(`${baseUrl}/number/prohibited/by-banking/${bankingId}`, {
                headers
            }),
            fetch(`${baseUrl}/branch/names/${bankingId}`, {
                headers
            }),
            fetch(`${baseUrl}/draw-schedule/names/${bankingId}`, {
                headers
            }),
            fetch(`${baseUrl}/draw-schedule-branch/by-banking/${bankingId}`, {
                headers
            })
        ]);

        const [
            prohibitedPayload,
            branchNamesPayload,
            scheduleNamesPayload,
            scheduleBranchPayload
        ] = await Promise.all([
            prohibitedResponse.ok
                ? prohibitedResponse.json().catch(() => null)
                : null,
            branchNamesResponse.ok
                ? branchNamesResponse.json().catch(() => null)
                : null,
            scheduleNamesResponse.ok
                ? scheduleNamesResponse.json().catch(() => null)
                : null,
            scheduleBranchResponse.ok
                ? scheduleBranchResponse.json().catch(() => null)
                : null
        ]);

        const prohibitedItems = Array.isArray(prohibitedPayload?.items)
            ? prohibitedPayload.items
            : [];

        const branchNames = Array.isArray(branchNamesPayload?.items)
            ? branchNamesPayload.items
            : [];

        const scheduleNames = Array.isArray(scheduleNamesPayload?.items)
            ? scheduleNamesPayload.items
            : [];

        const scheduleBranch = Array.isArray(scheduleBranchPayload?.items)
            ? scheduleBranchPayload.items
            : [];

        return {
            prohibitedItems,
            branchNames,
            scheduleNames,
            scheduleBranch
        };
    } catch {
        return emptyResult;
    }
};
