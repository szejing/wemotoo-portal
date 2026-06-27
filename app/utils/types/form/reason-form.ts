import type { ReasonType } from 'yeppi-common';

export type ReasonFormFields = {
	code: string;
	description: string;
	type: ReasonType | undefined;
	is_active: boolean;
};
