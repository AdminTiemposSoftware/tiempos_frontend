import {env} from '$env/dynamic/private';
import type {RequestHandler} from './$types';

export const POST: RequestHandler = async ({request, locals, cookies}) => {
    const baseUrl = env.API_URL;
    const branchId = locals.user?.branchId;
    const token = cookies.get('session_puesto') ?? null;

    if (!branchId || !token) {
        return new Response(JSON.stringify({error: 'Unauthorized'}), {status: 401});
    }

    try {
        const {serial} = await request.json();
        
        const response = await fetch(`${baseUrl}/winner/pay`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Auth-App': 'puesto'
            },
            body: JSON.stringify({serial, branch_id: branchId})
        });

        if (!response.ok) {
            throw new Error(`Failed to pay winner: ${response.statusText}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {status: 200});
    }
    catch (error) {
        return new Response(JSON.stringify({error: 'Error al pagar el tiquete'}), {status: 500});
    }
};