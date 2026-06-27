import type { ReasonType } from 'yeppi-common';

export type CreateReasonReq = {
	merchant_id: string;
	code: string;
	description: string;
	type: ReasonType;
	is_active?: boolean;
};

export type UpdateReasonReq = Partial<Omit<CreateReasonReq, 'code'>> & {
	merchant_id: string;
};

export type ReasonCreateStorePayload = Omit<CreateReasonReq, 'merchant_id'>;

export type ReasonUpdateStorePayload = Omit<UpdateReasonReq, 'merchant_id'>;
