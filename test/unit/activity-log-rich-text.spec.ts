import { describe, expect, it } from 'vitest';
import { getActivityLogBadgeColor, parseActivityLogRichText } from '../../app/utils/activity-log-rich-text';

describe('activity log rich text', () => {
	it('keeps plain activity descriptions as text', () => {
		expect(parseActivityLogRichText('Fulfillment created')).toEqual([{ type: 'text', text: 'Fulfillment created' }]);
	});

	it('parses UI identifiers and badge markers into renderable segments', () => {
		expect(parseActivityLogRichText('Order <UI>#160622</UI> status changed from <UBadge>paid</UBadge> to <UBadge>completed</UBadge>')).toEqual([
			{ type: 'text', text: 'Order ' },
			{ type: 'identifier', text: '#160622' },
			{ type: 'text', text: ' status changed from ' },
			{ type: 'badge', text: 'paid', color: 'info' },
			{ type: 'text', text: ' to ' },
			{ type: 'badge', text: 'completed', color: 'success' },
		]);
	});

	it('uses activity-log specific colors for statuses that need stronger timeline emphasis', () => {
		expect(getActivityLogBadgeColor('cancelled')).toBe('error');
		expect(getActivityLogBadgeColor('refunded')).toBe('error');
		expect(getActivityLogBadgeColor('processing')).toBe('warning');
		expect(getActivityLogBadgeColor('confirmed')).toBe('success');
		expect(getActivityLogBadgeColor('fulfilled')).toBe('success');
		expect(getActivityLogBadgeColor('voided')).toBe('error');
		expect(getActivityLogBadgeColor('created')).toBe('neutral');
	});

	it('falls back to neutral for unknown badge values', () => {
		expect(parseActivityLogRichText('Status is <UBadge>mystery</UBadge>')).toEqual([
			{ type: 'text', text: 'Status is ' },
			{ type: 'badge', text: 'mystery', color: 'neutral' },
		]);
	});

	it('does not parse unsupported tags as HTML', () => {
		expect(parseActivityLogRichText('Hello <script>alert(1)</script>')).toEqual([{ type: 'text', text: 'Hello <script>alert(1)</script>' }]);
	});

	it('parses bold markers for payment amounts', () => {
		expect(
			parseActivityLogRichText(
				'Order <UI>#ORD1</UI> marked as paid with <UBadge>Cash</UBadge>, ref <UI>TXN-1</UI>, amount <B>RM 100.00</B>',
			),
		).toEqual([
			{ type: 'text', text: 'Order ' },
			{ type: 'identifier', text: '#ORD1' },
			{ type: 'text', text: ' marked as paid with ' },
			{ type: 'badge', text: 'Cash', color: 'neutral' },
			{ type: 'text', text: ', ref ' },
			{ type: 'identifier', text: 'TXN-1' },
			{ type: 'text', text: ', amount ' },
			{ type: 'bold', text: 'RM 100.00' },
		]);
	});
});
