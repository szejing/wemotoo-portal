import { getAppointmentStatusColor, getOrderStatusColor, getPaymentStatusColor } from './options';

export type ActivityLogBadgeColor = 'primary' | 'error' | 'success' | 'warning' | 'secondary' | 'info' | 'neutral';

export type ActivityLogRichTextSegment =
	| {
			type: 'text';
			text: string;
	  }
	| {
			type: 'identifier';
			text: string;
	  }
	| {
			type: 'badge';
			text: string;
			color: ActivityLogBadgeColor;
	  };

const MARKER_PATTERN = /<(UBadge|UI)>(.*?)<\/\1>/g;

const activityLogStatusColorOverrides: Record<string, ActivityLogBadgeColor> = {
	cancel: 'error',
	cancelled: 'error',
	canceled: 'error',
	refund: 'error',
	refunded: 'error',
	processing: 'warning',
	success: 'success',
	successful: 'success',
	completed: 'success',
	confirmed: 'success',
	created: 'success',
	fulfilled: 'success',
	voided: 'error',
};

export const getActivityLogBadgeColor = (value: string): ActivityLogBadgeColor => {
	const normalizedValue = value.trim().toLowerCase();

	return (
		activityLogStatusColorOverrides[normalizedValue] ??
		getOrderStatusColor(normalizedValue) ??
		getPaymentStatusColor(normalizedValue) ??
		getAppointmentStatusColor(normalizedValue as Parameters<typeof getAppointmentStatusColor>[0]) ??
		'neutral'
	);
};

export const parseActivityLogRichText = (value?: string): ActivityLogRichTextSegment[] => {
	const text = value ?? '-';
	const segments: ActivityLogRichTextSegment[] = [];
	let currentIndex = 0;

	for (const match of text.matchAll(MARKER_PATTERN)) {
		const [fullMatch, tagName, rawContent] = match;
		const matchIndex = match.index ?? 0;

		if (matchIndex > currentIndex) {
			segments.push({ type: 'text', text: text.slice(currentIndex, matchIndex) });
		}

		const content = rawContent?.trim();
		if (content) {
			if (tagName === 'UBadge') {
				segments.push({ type: 'badge', text: content, color: getActivityLogBadgeColor(content) });
			} else {
				segments.push({ type: 'identifier', text: content });
			}
		}

		currentIndex = matchIndex + fullMatch.length;
	}

	if (currentIndex < text.length) {
		segments.push({ type: 'text', text: text.slice(currentIndex) });
	}

	return segments.length ? segments : [{ type: 'text', text }];
};
