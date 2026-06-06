import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, fetch, locals }) => {
    const baseUrl = env.API_URL;
    const bankingId = locals.user?.bankingId;

    if (!baseUrl) {
        return new Response(JSON.stringify({ items: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const response = await fetch(`${baseUrl}/branch/names/by-banking/${bankingId}`);
        const payload = await response.json().catch(() => null);

        return new Response(JSON.stringify(payload ?? { items: [] }), {
            status: response.ok ? 200 : response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch {
        return new Response(JSON.stringify({ items: [] }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
