import { describe, expect, it, vi } from 'vitest';
import { getOrderColumns } from '../../app/utils/table-columns/order/order';

vi.mock('#components', () => ({
	UBadge: { name: 'UBadge' },
	UButton: { name: 'UButton' },
	UIcon: { name: 'UIcon' },
	UTooltip: { name: 'UTooltip' },
}));

describe('getOrderColumns sorting', () => {
	const columns = getOrderColumns((key) => key);

	const columnById = (id: string) => {
		const column = columns.find((entry) => ('id' in entry && entry.id === id) || ('accessorKey' in entry && entry.accessorKey === id));
		expect(column).toBeTruthy();
		return column!;
	};

	it('disables sorting on the index column', () => {
		expect(columnById('index').enableSorting).toBe(false);
	});

	it('enables sorting on data columns', () => {
		for (const id of ['order_no', 'order_type', 'customer', 'status', 'gross_amt', 'tax_amt_exc', 'net_amt']) {
			expect(columnById(id).enableSorting).not.toBe(false);
		}
	});
});
