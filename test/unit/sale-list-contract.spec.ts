import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { OrderType } from 'yeppi-common';
import type { FulfillmentBatch } from '../../app/utils/types/order-fulfillment-shipping';
import type { Bill } from '../../app/utils/types/bill';
import { getSaleColumns } from '../../app/utils/table-columns/sale/sale';

vi.mock('#components', () => ({
	UBadge: { name: 'UBadge' },
}));

describe('sale list contract', () => {
	it('matches the canonical backend sale-list fields', () => {
		expectTypeOf<Bill>().toMatchTypeOf<{
			order_type: OrderType;
			fulfillments: FulfillmentBatch[];
			net_total: number;
			shipping_fee: number;
			payable_total: number;
		}>();
	});

	it('renders canonical net, shipping, and payable totals instead of legacy net_amt', () => {
		const columns = getSaleColumns((key) => key);
		const columnKeys = columns.map((column) => column.accessorKey ?? column.id);

		expect(columnKeys).toEqual([
			'order_no',
			'status',
			'gross_amt',
			'net_total',
			'shipping_fee',
			'payable_total',
			'disc_amt',
			'void_amt',
			'total_item_qty',
		]);

		const totalColumn = columns.find((column) => column.accessorKey === 'payable_total');
		expect(typeof totalColumn?.cell).toBe('function');

		const values = {
			net_amt: 90,
			net_total: 96,
			shipping_fee: 12,
			payable_total: 108,
		};
		const vnode = (totalColumn?.cell as (context: unknown) => { children: unknown })({
			row: {
				original: values,
				getValue: (key: keyof typeof values) => values[key],
			},
		});

		expect(String(vnode.children)).toBe('108');
	});
});
