import { z } from 'zod';
import { ReasonType } from 'yeppi-common';

type TranslateFn = (key: string) => string;

const reasonTypeSchema = z.nativeEnum(ReasonType, {
	errorMap: () => ({ message: 'type required' }),
});

const reasonFormSchema = (t: TranslateFn, includeCode: boolean) => {
	const base = z.object({
		description: z.string().trim().min(1, t('validation.reason.descriptionRequired')),
		type: reasonTypeSchema,
		is_active: z.boolean(),
	});

	if (includeCode) {
		return base.extend({
			code: z.string().trim().min(1, t('validation.reason.codeRequired')).max(64, t('validation.reason.codeMax64')),
		});
	}

	return base;
};

export const CreateReasonValidation = (t: TranslateFn) => reasonFormSchema(t, true);

export const UpdateReasonValidation = (t: TranslateFn) => reasonFormSchema(t, false);
