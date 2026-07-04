<script lang="ts">
    let isExpanded = $state(true);
    let currentPath = $state('/');
	let role = $derived($auth.user?.role ?? '');

	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
    
    onMount(() => {
        currentPath = window.location.pathname;
    });

    function toggleSidebar() {
        isExpanded = !isExpanded;
    }

    async function handleLogout() {
		let response;
		const isPuesto = window.location.pathname.startsWith('/puesto');
		if (isPuesto) {
			response = await fetch('/puesto/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});
		} else {
			response = await fetch('/banca/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});
		}
		if (response.ok) {
			window.location.href = isPuesto ? '/puesto/login' : '/banca/login';
		}

    }
	
	const navItems = [
		{ label: 'Venta', path: '/puesto/venta', roles: ['branch'] },
        { label: 'Inicio', path: '/banca/inicio', roles: ['banking']},
		{ label: 'Listas', path: '/banca/listas', roles: ['banking'] },
		// TODO : No crucial
		// TODO : Esta funcionalidad es para cuando el admin quiera tener mas bancas aparte de la suya
		// Probablemente sea mejor cambiar el nombre a "Bancas"
        // { label: 'Administradores', path: '/administradores'},
        { label: 'Bancas', path: '/banca/bancas', roles: ['banking'] },
		// Esta funcionalidad se debio de unir con la de "Sorteos" 
        // { label: 'Sorteos Base', path: '/sorteos-base'},
		// TODO : Esta funcionalidad es para cuando el admin quiera alquilar el software
        // { label: 'Usuarios', path: '/usuarios'}, 
        { label: 'Puestos', path: '/banca/puestos', roles: ['banking'] },
        { label: 'Sorteos', path: '/banca/sorteos', roles: ['banking'] },
        { label: 'Ganadores', path: '/banca/ganadores', roles: ['banking'] },
        { label: 'Ganadores', path: '/puesto/ganadores', roles: ['branch'] },
        { label: 'Reportes', path: '/puesto/reportes', roles: ['branch'] },
        { label: 'Cajas', path: '/puesto/cajas', roles: ['branch'] },
		{ label: 'Carga Excel', path: '/puesto/carga-excel', roles: ['branch'] }
	];

	let visibleNavItems = $derived(
		navItems.filter((item) => !item.roles || item.roles.includes(role))
	);
</script>

<aside class="sidebar" class:collapsed={!isExpanded}>
	<button class="collapse-toggle" onclick={toggleSidebar} aria-label="Toggle sidebar">
		<span class="icon" aria-hidden="true"></span>
	</button>

    <nav>
        <ul>
			{#each visibleNavItems as item (item.path)}
                <li aria-current={currentPath === item.path ? 'page' : undefined}>
                    <a href={item.path} title={item.label}>
                        <span>{item.label}</span>
                    </a>
                </li>
            {/each}
			<div 
				class="logout" 
				onclick={handleLogout}
				role="button"
				onkeydown={(e) => e.key === "Enter" && handleLogout()}
				tabindex="0"
			>
				<span>Cerrar sesión</span>
			</div>
        </ul>
    </nav>
</aside>

<style>
	.sidebar {
		position: relative;
		background: rgba(255, 255, 255, 0.95);
		transition: width 0.3s ease;
		z-index: 100;
		box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		border-right: 1px solid #e5e7eb;
		width: 240px;
		min-width: 240px;
		overflow: hidden;
	}

	.sidebar.collapsed {
		width: 80px;
		min-width: 80px;
	}

	.collapse-toggle {
		width: 100%;
		background: none;
		color: var(--color-text);
		transition: all 0.2s ease;
		display: flex;
		justify-content: center;
		border-bottom: 1px solid #e5e7eb;
	}

	.icon {
		position: relative;
		width: 1.4rem;
		height: 0.9rem;
		display: inline-block;
	}

	.icon::before,
	.icon::after,
	.icon {
		background: transparent;
	}

	.icon::before,
	.icon::after {
		content: '';
		position: absolute;
		left: 0;
		width: 100%;
		height: 2px;
		background: currentColor;
		border-radius: 999px;
	}

	.icon::before {
		top: 0;
		box-shadow: 0 0.35rem 0 currentColor;
	}

	.icon::after {
		bottom: 0;
	}

	.collapse-toggle span {
		margin-left: auto;
	}

	.collapse-toggle:hover {
		background: rgba(var(--color-theme-1-rgb), 0.1);
		color: var(--color-theme-1);
	}

	nav {
		flex: 1;
		padding-top: 0;
		overflow-y: auto;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	a, .logout{
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		color: var(--color-text);
		text-decoration: none;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 0.9rem;
		transition: all 0.2s linear;
	}

	a:hover {
		background: rgba(var(--color-theme-1-rgb), 0.15);
		color: var(--color-theme-1);
	}

	a span{
		font-size: 0.9rem;
		white-space: nowrap;
		overflow: hidden;
		opacity: 1;
		transition: opacity 0.3s ease;
	}

	.sidebar.collapsed a span {
		display: none;
	}

	.sidebar.collapsed .logout {
		display: none;
	}

	.logout {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		cursor: pointer;
	}
</style>
