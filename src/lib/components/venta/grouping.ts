export type GroupingMode = 'branch' | 'draw_schedule' | 'draw' | 'date';

export type ReportItem = {
	branch_id: number;
	branch_name: string;
	draw_schedule_id: number;
	draw_schedule_name: string;
	draw_id: number;
	draw_name: string;
	number: number;
	amount: number;
	is_reventado: boolean;
	is_megareventado: boolean;
	date: string;
};

export type GroupNode = {
	key: string;
	label: string;
	subtotal: number;
	items: ReportItem[];
	children: GroupNode[];
};

export const GROUPING_OPTIONS: { value: GroupingMode; label: string }[] = [
	{ value: 'branch', label: 'Puesto' },
	{ value: 'draw_schedule', label: 'Horario' },
	{ value: 'draw', label: 'Sorteo' },
	{ value: 'date', label: 'Fecha' }
];

export function groupReportByNumber(reportItems: ReportItem[]): Record<number, ReportItem[]> {
	return reportItems.reduce<Record<number, ReportItem[]>>((acc, item) => {
		(acc[item.number] ??= []).push(item);
		return acc;
	}, {});
}

export function buildGroupingTree(reportItems: ReportItem[], groupingModes: GroupingMode[]): GroupNode[] {
	const activeModes = groupingModes.length > 0 ? groupingModes : ['branch'];
	return buildGroupingLevel(reportItems, activeModes, 0);
}

export function formatAmount(amount: number) {
	return new Intl.NumberFormat('es-DO').format(amount);
}

function buildGroupingLevel(reportItems: ReportItem[], groupingModes: GroupingMode[], depth: number): GroupNode[] {
	const mode = groupingModes[depth];
	const buckets = new Map<string, { key: string; label: string; subtotal: number; items: ReportItem[] }>();

	for (const item of reportItems) {
		const key = getGroupingValue(item, mode);
		const existing = buckets.get(key);

		if (existing) {
			existing.subtotal += item.amount;
			existing.items.push(item);
			continue;
		}

		buckets.set(key, {
			key,
			label: getGroupingLabel(item, mode),
			subtotal: item.amount,
			items: [item]
		});
	}

	return Array.from(buckets.values()).map((bucket) => ({
		key: bucket.key,
		label: bucket.label,
		subtotal: bucket.subtotal,
		items: depth === groupingModes.length - 1 ? bucket.items : [],
		children: depth < groupingModes.length - 1 ? buildGroupingLevel(bucket.items, groupingModes, depth + 1) : []
	}));
}

function getGroupingValue(item: ReportItem, mode: GroupingMode) {
	switch (mode) {
		case 'branch':
			return String(item.branch_id);
		case 'draw_schedule':
			return String(item.draw_schedule_id);
		case 'draw':
			return String(item.draw_id);
		case 'date':
			return item.date;
	}
}

export function getGroupingLabel(item: ReportItem, mode: GroupingMode) {
	switch (mode) {
		case 'branch':
			return item.branch_name;
		case 'draw_schedule':
			return item.draw_schedule_name;
		case 'draw':
			return item.draw_name;
		case 'date':
			return item.date;
	}
}

export function getGroupingLabelForMode(mode: GroupingMode) {
	switch (mode) {
		case 'branch':
			return 'Branch';
		case 'draw_schedule':
			return 'Draw Schedule';
		case 'draw':
			return 'Draw';
		case 'date':
			return 'Date';
	}
}