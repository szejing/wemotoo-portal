import { ReasonType } from 'yeppi-common';

type TranslateFn = (key: string) => string;

export const reasonTypeOptions = (t: TranslateFn) => [
	{ label: t('options.reasonType.returnExchange'), value: ReasonType.RETURN_EXCHANGE },
	{ label: t('options.reasonType.cancelOrder'), value: ReasonType.CANCEL_ORDER },
];

export const reasonTypeFilterOptions = (t: TranslateFn) => [
	{ label: t('options.all'), value: 'all' },
	...reasonTypeOptions(t),
];
