export type Ticket = {
	id: number;
	relative_id: number;
	username: string | null;
	serial: string;
	amount: number | string;
	date: string;
	time: string | null;
	printed_at?: string | null;
	detail: string | null;
	enabled: boolean;
	deleted_by: number | null;
	deleted_at: string | null;
	deleted_by_name?: string | null;
	branch_name?: string | null;
	draw_name?: string | null;
	draw_schedule_name?: string | null;
};
