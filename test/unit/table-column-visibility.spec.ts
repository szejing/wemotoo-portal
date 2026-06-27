import { describe, expect, it } from 'vitest';
import type { TableColumn } from '@nuxt/ui';
import {
	columnOptionsFromLabelMap,
	filterVisibleColumns,
	getColumnKey,
	getDefaultSelectedColumnKeys,
} from '../../app/utils/table-columns/visibility';

describe('table column visibility', () => {
	const t = (key: string) => key;

	it('builds column options from a label map', () => {
		expect(columnOptionsFromLabelMap(t, { order_no: 'table.orderNo', status: 'table.status' })).toEqual([
			{ key: 'order_no', label: 'table.orderNo' },
			{ key: 'status', label: 'table.status' },
		]);
	});

	it('resolves column keys from id or accessorKey', () => {
		expect(getColumnKey({ accessorKey: 'name' } as TableColumn<unknown>)).toBe('name');
		expect(getColumnKey({ id: 'index' } as TableColumn<unknown>)).toBe('index');
		expect(getColumnKey({ id: 'code_description', accessorKey: 'code' } as TableColumn<unknown>)).toBe('code_description');
		expect(getColumnKey({ accessorKey: 'is_active' } as TableColumn<unknown>)).toBe('is_active');
	});

	it('filters columns by selected keys and keeps pinned keys visible', () => {
		const columns = [
			{ accessorKey: 'name' },
			{ accessorKey: 'status' },
			{ accessorKey: 'total' },
		] as TableColumn<{ name: string }>[];

		expect(filterVisibleColumns(columns, ['name'], ['status'])).toEqual([columns[0], columns[1]]);
	});

	it('defaults selected keys while excluding hidden keys', () => {
		const options = [
			{ key: 'biz_date', label: 'Biz Date' },
			{ key: 'currency_code', label: 'Currency' },
			{ key: 'status', label: 'Status' },
		];

		expect(getDefaultSelectedColumnKeys(options, ['currency_code'])).toEqual(['biz_date', 'status']);
	});
});
