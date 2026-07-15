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
});
