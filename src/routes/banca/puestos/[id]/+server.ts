import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ cookies, fetch, params }) => {
    const baseUrl = env.API_URL;
    const token = cookies.get('session_banca');

    if (!baseUrl) {
        return new Response(JSON.stringify({ items: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const response = await fetch(`${baseUrl}/branch/${params.id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'X-Auth-App': 'banca'
            },
        });
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

export const PUT: RequestHandler = async ({ cookies, fetch, params, request }) => {
    const baseUrl = env.API_URL;
    const token = cookies.get('session_banca');
    const payload = await request.json().catch(() => null);

    if (!baseUrl) {
        return new Response(JSON.stringify({ items: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!token) {
        return new Response(JSON.stringify({ items: [] }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!payload) {
        return new Response(JSON.stringify({ items: [] }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const response = await fetch(`${baseUrl}/branch/${params.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'X-Auth-App': 'banca'
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => null);

        return new Response(JSON.stringify(result ?? { items: [] }), {
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