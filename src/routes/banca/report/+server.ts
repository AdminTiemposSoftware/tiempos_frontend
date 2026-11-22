import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, fetch, locals, cookies }) => {
    const baseUrl = env.API_URL;
    const bankingId = locals.user?.bankingId;
    const token = cookies.get('session_banca') ?? null;

    if (!baseUrl || !bankingId) {
        return new Response(JSON.stringify({ error: 'Missing API_URL or bankingId.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const url = new URL(request.url);
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');
    const branches = url.searchParams.get('branches');
    const drawSchedules = url.searchParams.get('draw_schedules');
    const groupingModes = url.searchParams.get('grouping_modes') ?? 'date,draw_schedule';

    if (!dateFrom || !dateTo || !branches || !drawSchedules) {
        return new Response(JSON.stringify({ error: 'Payload must include date_from, date_to, branches, and draw_schedules.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Auth-App': 'banca'
    };
    const reportQuery = `date_from=${dateFrom}&date_to=${dateTo}&branches=${encodeURIComponent(branches)}&draw_schedules=${encodeURIComponent(drawSchedules)}&grouping_modes=${encodeURIComponent(groupingModes)}`;
    const reportResponse = await fetch(`${baseUrl}/report/filtered?${reportQuery}`, { method: 'GET', headers });
    const responsePayload = await reportResponse.json().catch(() => null);

    return new Response(JSON.stringify(responsePayload), {
        status: reportResponse.status,
        headers: { 'Content-Type': 'application/json' }
    });
};
