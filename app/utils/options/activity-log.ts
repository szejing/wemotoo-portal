import type { ActivityLogAction, ActivityLogActorType, ActivityLogSource, ActivityLogVisibility } from '~/utils/types/activity-log';

type TranslateFn = (key: string) => string;

export const ACTIVITY_LOG_FILTER_ALL = 'all' as const;

export const activityLogActions: ActivityLogAction[] = [
	'created',
	'updated',
	'deleted',
	'restored',
	'imported',
	'checkout_created',
	'status_changed',
	'payment_status_changed',
	'customer_request_created',
	'refund_updated',
	'fulfillment_updated',
	'shipment_updated',
	'profile_updated',
	'login',
	'logout',
	'relogin',
];

export const activityLogActorTypes: ActivityLogActorType[] = ['admin', 'customer', 'system', 'webhook'];

export const activityLogSources: ActivityLogSource[] = ['admin_portal', 'storefront', 'webhook', 'system', 'import'];

export const activityLogVisibilities: ActivityLogVisibility[] = ['admin', 'customer', 'both'];

export const getActivityLogActionLabel = (t: TranslateFn, action?: string) => (action ? t(`options.activityLogAction.${action}`) : '-');

export const getActivityLogActorTypeLabel = (t: TranslateFn, actorType?: string) => (actorType ? t(`options.activityLogActorType.${actorType}`) : '-');

export const getActivityLogSourceLabel = (t: TranslateFn, source?: string) => (source ? t(`options.activityLogSource.${source}`) : '-');

export const getActivityLogVisibilityLabel = (t: TranslateFn, visibility?: string) => (visibility ? t(`options.activityLogVisibility.${visibility}`) : '-');

export const getActivityLogActionOptions = (t: TranslateFn) => [
	{ label: t('options.all'), value: ACTIVITY_LOG_FILTER_ALL },
	...activityLogActions.map((value) => ({ label: getActivityLogActionLabel(t, value), value })),
];

export const getActivityLogActorTypeOptions = (t: TranslateFn) => [
	{ label: t('options.all'), value: ACTIVITY_LOG_FILTER_ALL },
	...activityLogActorTypes.map((value) => ({ label: getActivityLogActorTypeLabel(t, value), value })),
];

export const getActivityLogSourceOptions = (t: TranslateFn) => [
	{ label: t('options.all'), value: ACTIVITY_LOG_FILTER_ALL },
	...activityLogSources.map((value) => ({ label: getActivityLogSourceLabel(t, value), value })),
];

export const getActivityLogVisibilityOptions = (t: TranslateFn) => [
	{ label: t('options.all'), value: ACTIVITY_LOG_FILTER_ALL },
	...activityLogVisibilities.map((value) => ({ label: getActivityLogVisibilityLabel(t, value), value })),
];
