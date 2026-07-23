import { describe, expect, it } from 'vitest';
import { OrderStatus } from 'yeppi-common';
import { getDefaultOrderStatuses } from '../../app/utils/options/order-status';
import {
	buildOrderExportDateFilter,
	buildOrderExportQueryParams,
	getOrderExportExpand,
	ORDER_EXPORT_MAX_ROWS,
	ORDER_EXPORT_SORT_ORDERBY,
} from '../../app/utils/order-export';

describe('order export helpers', () => {
	it('builds date filter for a range', () => {
		const filter = buildOrderExportDateFilter({
			start: new Date('2026-07-01'),
			end: new Date('2026-07-14'),
		});

		expect(filter).toBe("(biz_date between '2026-07-01' and '2026-07-14')");
	});

	it('uses detail expand when item details are enabled', () => {
		expect(getOrderExportExpand(true)).toContain('items.taxes');
		expect(getOrderExportExpand(false)).not.toContain('items.taxes');
		expect(getOrderExportExpand(false)).toContain('taxes');
	});

	it('builds export query params from modal options', () => {
		const params = buildOrderExportQueryParams({
			date_range: {
				start: new Date('2026-07-01'),
				end: new Date('2026-07-14'),
			},
			statuses: [OrderStatus.COMPLETED],
			sort: 'order_no_asc',
			include_item_details: true,
		});

		expect(params.$top).toBe(ORDER_EXPORT_MAX_ROWS);
		expect(params.$skip).toBe(0);
		expect(params.$filter).toContain(`status eq '${OrderStatus.COMPLETED}'`);
		expect(params.$orderby).toBe(ORDER_EXPORT_SORT_ORDERBY.order_no_asc);
		expect(params.include_item_details).toBe(true);
		expect(params.$expand).toContain('items.taxes');
	});

	it('omits status filter when all statuses are selected', () => {
		const params = buildOrderExportQueryParams({
			date_range: {
				start: new Date('2026-07-01'),
				end: new Date('2026-07-14'),
			},
			statuses: getDefaultOrderStatuses(),
			sort: 'biz_date_desc',
			include_item_details: false,
		});

		expect(params.$filter).not.toContain('status');
		expect(params.include_item_details).toBe(false);
	});
});
