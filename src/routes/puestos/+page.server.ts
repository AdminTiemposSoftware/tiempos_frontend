// +page.server.ts

import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const baseUrl = env.API_URL;

	if (!baseUrl) {
		return { items: [] };
	}

	try {
		const response = await fetch(`${baseUrl}/branch`);

		if (!response.ok) {
			return { items: [] };
		}

		const payload = await response.json().catch(() => null);

		const items = Array.isArray(payload?.items)
			? payload.items
			: [];

		return { items };
	} catch {
		return { items: [] };
	}
};

export const actions: Actions = {
	addUser: async ({ request, fetch }) => {
		const baseUrl = env.API_URL;

		if (!baseUrl) {
			return fail(500, {
				error: 'Missing API_URL'
			});
		}

		const data = await request.formData();
		console.log('Form data received:', Object.fromEntries(data.entries()));

		const payload = {
			username: data.get('username'),
			name: data.get('name'),
			phone: data.get('phone'),
			password: data.get('password')
		};

		

		const response = await fetch(`${baseUrl}/user`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			return fail(400, {
				error: 'Failed to create user'
			});
		}

		return {
			success: true
		};
	}
};