import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('order detail fulfillment owner', () => {
	it('defaults missing and unknown query types to order behavior', () => {
		const source = readFileSync(resolve(process.cwd(), 'app/pages/orders/[order_no].vue'), 'utf8');

		expect(source).toContain("type.value === 'sale' ? 'sale' : 'order'");
		expect(source.match(/type\.value === 'order'/g) ?? []).toHaveLength(0);
		expect(source.match(/ownerType\.value === 'order'/g) ?? []).toHaveLength(3);
		expect(source).toContain('new_status, ownerType.value)');
	});

	it('passes fulfillment context and the resolved action through the global resend control', () => {
		const source = readFileSync(resolve(process.cwd(), 'app/pages/orders/[order_no].vue'), 'utf8');

		expect(source).toContain('fulfillments: current.fulfillments,');
		expect(source.match(/resendCurrentStatusEmail\(record\.value\.order_no, resend_email_action\.value\)/g) ?? []).toHaveLength(2);
	});

	it('shows the customer email section only when the current status has a resend action', () => {
		const source = readFileSync(resolve(process.cwd(), 'app/pages/orders/[order_no].vue'), 'utf8');
		const customerEmailBlocks = source.match(/<ZSectionOrderDetailCustomerEmail[\s\S]*?\/>/g) ?? [];

		expect(customerEmailBlocks).toHaveLength(2);
		for (const block of customerEmailBlocks) {
			expect(block).toContain('v-if="resend_email_action"');
		}
	});

	it('places delivery fulfillment controls in the desktop sidebar and mobile actions drawer', () => {
		const source = readFileSync(resolve(process.cwd(), 'app/pages/orders/[order_no].vue'), 'utf8');
		const occurrences = source.match(/<FulfillmentBatchList/g) ?? [];

		expect(occurrences).toHaveLength(2);
		expect(source.indexOf('<FulfillmentBatchList')).toBeGreaterThan(source.indexOf('<!-- Sidebar (desktop) -->'));
		expect(source.match(/v-if="orderForModal && \(record\?\.order_type \?\? OrderType\.PICKUP\) === OrderType\.DELIVERY"/g) ?? []).toHaveLength(2);
		expect(source.match(/:owner-type="ownerType"/g) ?? []).toHaveLength(2);
		expect(source.match(/@refresh="getOrderDetails"/g) ?? []).toHaveLength(2);
	});
});
