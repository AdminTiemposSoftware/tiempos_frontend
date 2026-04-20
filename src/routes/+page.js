import { redirect } from '@sveltejs/kit';

export async function load({ parent }) {
	const { user } = await parent();
	const role = user?.role ?? 'user';
	const target = role === 'admin' ? '/venta' : '/ganadores';
	throw redirect(302, target);
}