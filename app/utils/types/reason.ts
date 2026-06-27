import type { ReasonType } from 'yeppi-common';

export type Reason = {
	code: string;
	description: string;
	type: ReasonType;
	is_active: boolean;
	created_at?: string;
	updated_at?: string;
};
