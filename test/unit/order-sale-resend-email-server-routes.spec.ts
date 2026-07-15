import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('order/sale resend email server routes', () => {
	it.each(['orders', 'sales'])('requires and forwards the selected action for %s', (owner) => {
		const source = readFileSync(resolve(process.cwd(), `server/routes/merchant/${owner}/[order_no]/resend-email.post.ts`), 'utf8');

		expect(source).toContain("import { OrderResendEmailAction } from 'yeppi-common';");
		expect(source).toContain('readBody<{ action?: OrderResendEmailAction }>(event)');
		expect(source).toContain('Object.values(OrderResendEmailAction).includes(action as OrderResendEmailAction)');
		expect(source).toContain('body: { action },');
		expect(source).not.toContain('body: {},');
	});
});
