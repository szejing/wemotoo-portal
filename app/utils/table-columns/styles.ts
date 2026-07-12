import { h } from 'vue';
import { formatCurrency } from 'yeppi-common';

export const TABLE_ALIGN_RIGHT = 'text-right tabular-nums';
export const TABLE_ALIGN_CENTER = 'text-center';

export type TableCellAlign = 'left' | 'right' | 'center';

export function headerCell(label: string, align: TableCellAlign = 'left') {
	const alignClass = align === 'right' ? TABLE_ALIGN_RIGHT : align === 'center' ? TABLE_ALIGN_CENTER : 'text-left';
	return h('div', { class: alignClass }, label);
}

export function numberCell(value: number, align: TableCellAlign = 'right') {
	const alignClass = align === 'right' ? TABLE_ALIGN_RIGHT : align === 'center' ? TABLE_ALIGN_CENTER : 'text-left';
	return h('div', { class: alignClass }, value);
}

export function moneyCell(value: number, currencyCode: string) {
	return h('div', { class: TABLE_ALIGN_RIGHT }, formatCurrency(value, currencyCode));
}

export function optionalCell(value?: number) {
	return value == null ? mutedCell() : numberCell(value);
}

export function optionalMoneyCell(value: number | undefined, currencyCode: string) {
	return value == null ? mutedCell() : moneyCell(value, currencyCode);
}

export function mutedCell(content = '-') {
	return h('span', { class: 'text-muted' }, content);
}

export function primaryCell(content: string | number) {
	return h('div', { class: 'font-medium text-default' }, String(content));
}

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
