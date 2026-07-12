import { describe, expect, it } from 'vitest';
import { OrderItemStatus } from 'yeppi-common';
import { buildSummOrderItemODataFilter } from '../../app/utils/summ-order-item-filter';

describe('buildSummOrderItemODataFilter', () => {
	it('does not include order-level status (SummOrderItem has item_status only)', () => {
		const filter = buildSummOrderItemODataFilter({
			date_range: {
				start: new Date('2026-07-05T00:00:00'),
				end: new Date('2026-07-12T00:00:00'),
			},
			currency_code: 'MYR',
			item_status: OrderItemStatus.ACTIVE,
		});

		expect(filter).not.toMatch(/(^|[^_])status eq/);
		expect(filter).toContain(`item_status eq '${OrderItemStatus.ACTIVE}'`);
		expect(filter).toContain("currency_code eq 'MYR'");
		expect(filter).toContain("(biz_date between '2026-07-05' and '2026-07-12')");
	});

	it('omits item_status when unset', () => {
		const filter = buildSummOrderItemODataFilter({
			date_range: {
				start: new Date('2026-07-05T00:00:00'),
				end: new Date('2026-07-12T00:00:00'),
			},
			currency_code: 'MYR',
		});

		expect(filter).toBe(
			"currency_code eq 'MYR' and (biz_date between '2026-07-05' and '2026-07-12')",
		);
	});
});
