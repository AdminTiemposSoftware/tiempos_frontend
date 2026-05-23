import { redirect } from '@sveltejs/kit';

export async function load({ parent }) {
	const { user } = await parent();
	const role = user?.role ?? 'branch';
	const target = role === 'branch' ? '/puesto/venta' : '/banca/ganadores';
	throw redirect(302, target);
}