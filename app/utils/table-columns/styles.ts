import type { Column } from '@tanstack/vue-table';
import { h } from 'vue';
import { formatCurrency } from 'yeppi-common';
import { UIcon } from '#components';

export const TABLE_ALIGN_RIGHT = 'text-right tabular-nums';
export const TABLE_ALIGN_CENTER = 'text-center';

export type TableCellAlign = 'left' | 'right' | 'center';

const alignClass = (align: TableCellAlign = 'left') => {
	return align === 'right' ? TABLE_ALIGN_RIGHT : align === 'center' ? TABLE_ALIGN_CENTER : 'text-left';
};

export const headerCell = (label: string, align: TableCellAlign = 'left') => {
	return h('div', { class: alignClass(align) }, label);
};

export const getSortableHeader = <TData>(column: Column<TData, unknown>, label: string, align: TableCellAlign = 'left') => {
	const isSorted = column.getIsSorted();
	const icon = isSorted ? (isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow') : 'i-lucide-arrow-up-down';
	const ariaSort = isSorted === 'asc' ? 'ascending' : isSorted === 'desc' ? 'descending' : 'none';
	const isRight = align === 'right';
	const iconTone = isSorted ? 'text-highlighted' : 'text-muted';
	const iconNode = h(UIcon, { name: icon, class: ['size-4 shrink-0', iconTone] });

	// Same wrapper/typography as headerCell; plain button avoids UButton padding/font.
	// Right-aligned columns put the sort icon on the leading side so the label
	// text shares the same right edge as numeric/money cells.
	return h(
		'div',
		{ class: alignClass(align) },
		h(
			'button',
			{
				type: 'button',
				class: [
					'inline-flex items-center gap-1 cursor-pointer bg-transparent p-0 border-0 font-inherit text-inherit',
					isSorted ? 'font-bold text-highlighted' : '',
				],
				'aria-sort': ariaSort,
				onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
			},
			isRight ? [iconNode, label] : [label, iconNode],
		),
	);
};

export const numberCell = (value: number, align: TableCellAlign = 'right') => {
	return h('div', { class: alignClass(align) }, value);
};

export const moneyCell = (value: number, currencyCode: string) => {
	return h('div', { class: TABLE_ALIGN_RIGHT }, formatCurrency(value, currencyCode));
};

export const optionalCell = (value?: number) => {
	return value == null ? mutedCell() : numberCell(value);
};

export const optionalMoneyCell = (value: number | undefined, currencyCode: string) => {
	return value == null ? mutedCell() : moneyCell(value, currencyCode);
};

export const mutedCell = (content = '-') => {
	return h('span', { class: 'text-muted' }, content);
};

export const primaryCell = (content: string | number) => {
	return h('div', { class: 'font-medium text-default' }, String(content));
};

export const tableCellMeta = {
	rightNumeric: {
		meta: {
			class: {
				th: TABLE_ALIGN_RIGHT,
				td: TABLE_ALIGN_RIGHT,
			},
		},
	},
	center: {
		meta: {
			class: {
				th: TABLE_ALIGN_CENTER,
				td: TABLE_ALIGN_CENTER,
			},
		},
	},
} as const;
