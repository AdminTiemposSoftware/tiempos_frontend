import { redirect, Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

type AuthUser = {
	id: string;
	role: string;
	username?: string;
} | null;

const publicPrefixes = ['/_app', '/login', '/robots.txt', '/favicon'];

// TODO - Refactor to support multiple auth methods and providers more cleanly
const ENV_LOGIN_USERNAME = env.PRIVATE_AUTH_USERNAME ?? '';
const ENV_LOGIN_PASSWORD = env.PRIVATE_AUTH_PASSWORD ?? '';
const ENV_LOGIN_TOKEN = env.PRIVATE_AUTH_TOKEN ?? 'env-login';
const ENV_LOGIN_USER_ID = env.PRIVATE_AUTH_USER_ID ?? 'env-user';
const ENV_LOGIN_ROLE = env.PRIVATE_AUTH_ROLE ?? 'admin';

const baseUrl = env.API_URL;	

async function fetchUser(token: string, fetchFn: typeof fetch): Promise<AuthUser> {
	if (!baseUrl) {
		return {
			id: ENV_LOGIN_USER_ID,
			role: ENV_LOGIN_ROLE,
			username: ENV_LOGIN_USERNAME || undefined
		};
	}

	try {
		const response = await fetchFn(`${baseUrl}/auth/me`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			return null;
		}

		const payload = await response.json().catch(() => null);
		const user = payload?.user ?? payload;
		if (!user?.id) {
			return null;
		}

		return {
			id: String(user.id),
			role: String(user.role ?? 'user'),
			username: user.username ? String(user.username) : undefined
		};
	} catch {
		return null;
	}
}


export const handle: Handle = async ({ event, resolve }) => {
	if (building) {
		return resolve(event);
	}

	const { pathname } = event.url;

	// LOGIN POST
	if (pathname === '/login' && event.request.method === 'POST') {
		const data = await event.request.formData();

		const username = String(data.get('username') ?? '').trim();
		const password = String(data.get('password') ?? '').trim();

		// local env auth
		if (username === ENV_LOGIN_USERNAME && password === ENV_LOGIN_PASSWORD) {
			event.cookies.set('session', ENV_LOGIN_TOKEN, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: false
			});

			throw redirect(303, '/venta');
		}


		console.log('Attempting login with username:', username);
		return new Response(
			JSON.stringify({
				type: 'failure',
				status: 401,
				data: {
					error: 'Invalid credentials',
					values: { username }
				}
			}),
			{
				status: 401,
				headers: {
					'content-type': 'application/json'
				}
			}
		);
	}

	// existing auth logic
	const token = event.cookies.get('session');
	const isPublic = publicPrefixes.some((prefix) =>
		pathname.startsWith(prefix)
	);

	if (token) {
		event.locals.user = await fetchUser(token, event.fetch);
	} else {
		event.locals.user = null;
	}

	if (!event.locals.user && !isPublic) {
		throw redirect(303, '/login');
	}

	if (event.locals.user && pathname.startsWith('/login')) {
		throw redirect(303, '/venta');
	}

	return resolve(event);
};