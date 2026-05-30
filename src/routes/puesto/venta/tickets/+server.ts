import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, locals, url, cookies }) => {
    const baseUrl = env.API_URL;
    const branchId = locals.user?.branchId;
    const scheduleId = url.searchParams.get('scheduleId');
    const date = url.searchParams.get('date');
    const token = cookies.get('session') ?? '';

    if (!baseUrl || !branchId || !scheduleId || !date) {
        return new Response(JSON.stringify({ items: [], details: [] }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const response = await fetch(
        `${baseUrl}/ticket/by-schedule/${scheduleId}/${branchId}/${date}`,
        {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
        }
    );
    const payload = await response.json().catch(() => null);

    return new Response(JSON.stringify(payload ?? { items: [], details: [] }), {
        status: response.ok ? 200 : response.status,
        headers: { 'Content-Type': 'application/json' }
    });
};
