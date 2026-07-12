import { describe, expect, it } from 'vitest';
import { OrderStatus } from 'yeppi-common';
import { mapSummBillsToTableRows } from '../../app/utils/summ-bill-table-rows';

const base = {
	currency_code: 'MYR',
	gross_amt_exc: 0,
	net_amt_exc: 0,
	total_voided_qty: 0,
};

describe('mapSummBillsToTableRows', () => {
	it('when groupByStatus (All), keeps same-date rows separate by status', () => {
		const rows = mapSummBillsToTableRows(
			[
				{
					...base,
					biz_date: new Date('2026-07-12T00:00:00'),
					status: OrderStatus.PROCESSING,
					gross_amt: 100,
					net_amt: 90,
					total_orders: 2,
					total_qty: 3,
				},
				{
					...base,
					biz_date: new Date('2026-07-12T00:00:00'),
					status: OrderStatus.PAID,
					gross_amt: 50,
					net_amt: 45,
					total_orders: 1,
					total_qty: 1,
				},
			],
			{ groupByStatus: true },
		);

		expect(rows).toHaveLength(2);
		expect(rows[0]?.status).toBe(OrderStatus.PROCESSING);
		expect(rows[0]?.net_amt).toBe(90);
		expect(rows[0]?.total_orders).toBe(2);
		expect(rows[1]?.status).toBe(OrderStatus.PAID);
		expect(rows[1]?.net_amt).toBe(45);
		expect(rows[1]?.total_orders).toBe(1);
	});

	it('when groupByStatus (All), sums same date+status across outlets', () => {
		const rows = mapSummBillsToTableRows(
			[
				{
					...base,
					biz_date: new Date('2026-07-12T00:00:00'),
					status: OrderStatus.PAID,
					gross_amt: 100,
					net_amt: 90,
					total_orders: 2,
					total_qty: 3,
				},
				{
					...base,
					biz_date: new Date('2026-07-12T00:00:00'),
					status: OrderStatus.PAID,
					gross_amt: 50,
					net_amt: 45,
					total_orders: 1,
					total_qty: 1,
				},
			],
			{ groupByStatus: true },
		);

		expect(rows).toHaveLength(1);
		expect(rows[0]?.status).toBe(OrderStatus.PAID);
		expect(rows[0]?.net_amt).toBe(135);
		expect(rows[0]?.total_orders).toBe(3);
		expect(rows[0]?.total_qty).toBe(4);
	});

	it('when not groupByStatus, combines same-date rows across statuses', () => {
		const rows = mapSummBillsToTableRows(
			[
				{
					...base,
					biz_date: new Date('2026-07-12T00:00:00'),
					status: OrderStatus.PROCESSING,
					gross_amt: 100,
					net_amt: 90,
					total_orders: 2,
					total_qty: 3,
				},
				{
					...base,
					biz_date: new Date('2026-07-12T00:00:00'),
					status: OrderStatus.PAID,
					gross_amt: 50,
					net_amt: 45,
					total_orders: 1,
					total_qty: 1,
				},
			],
			{ groupByStatus: false },
		);

		expect(rows).toHaveLength(1);
		expect(rows[0]?.net_amt).toBe(135);
		expect(rows[0]?.total_orders).toBe(3);
	});
});
