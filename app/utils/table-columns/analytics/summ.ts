import { h } from 'vue';
import { UBadge } from '#components';
import type { TableColumn, TableRow } from '@nuxt/ui';
import { getFormattedDate, getOrderStatusColor, OrderStatus } from 'yeppi-common';
import { headerCell, moneyCell, mutedCell, numberCell, optionalCell, optionalMoneyCell } from '../styles';
import type { SummBillTableRow, SummCountKey, TranslateFn } from './types';

type NumericSummColumnKey = keyof Pick<
	SummBillTableRow,
	| 'gross_amt'
	| 'net_amt'
	| 'disc_amt'
	| 'gross_amt_exc'
	| 'net_amt_exc'
	| 'tax_amt_inc'
	| 'tax_amt_exc'
	| 'void_amt'
	| 'adj_amt'
	| 'total_orders'
	| 'total_txns'
	| 'total_qty'
	| 'total_voided_qty'
>;

const SUMM_COUNT_LABELS: Record<SummCountKey, string> = {
	total_orders: 'table.totalOrders',
	total_txns: 'table.totalTransactions',
};

const SUMM_BASE_COLUMN_LABELS = {
	biz_date: 'table.bizDate',
	currency_code: 'table.currency',
	status: 'table.orderStatus',
	gross_amt: 'table.grossAmt',
	net_amt: 'table.netAmt',
	disc_amt: 'table.discountAmt',
	gross_amt_exc: 'table.grossAmtExc',
	net_amt_exc: 'table.netAmtExc',
	tax_amt_inc: 'table.taxAmtInc',
	tax_amt_exc: 'table.taxAmtExc',
	void_amt: 'table.voidAmt',
	adj_amt: 'table.adjAmt',
	total_qty: 'table.totalItems',
	total_voided_qty: 'pages.voidedLabel',
} as const;

export function getSummColumnLabels(countKey: SummCountKey) {
	return {
		biz_date: SUMM_BASE_COLUMN_LABELS.biz_date,
		currency_code: SUMM_BASE_COLUMN_LABELS.currency_code,
		status: SUMM_BASE_COLUMN_LABELS.status,
		gross_amt: SUMM_BASE_COLUMN_LABELS.gross_amt,
		net_amt: SUMM_BASE_COLUMN_LABELS.net_amt,
		disc_amt: SUMM_BASE_COLUMN_LABELS.disc_amt,
		gross_amt_exc: SUMM_BASE_COLUMN_LABELS.gross_amt_exc,
		net_amt_exc: SUMM_BASE_COLUMN_LABELS.net_amt_exc,
		tax_amt_inc: SUMM_BASE_COLUMN_LABELS.tax_amt_inc,
		tax_amt_exc: SUMM_BASE_COLUMN_LABELS.tax_amt_exc,
		void_amt: SUMM_BASE_COLUMN_LABELS.void_amt,
		adj_amt: SUMM_BASE_COLUMN_LABELS.adj_amt,
		[countKey]: SUMM_COUNT_LABELS[countKey],
		total_qty: SUMM_BASE_COLUMN_LABELS.total_qty,
		total_voided_qty: SUMM_BASE_COLUMN_LABELS.total_voided_qty,
	} as const;
}

const statusLabelKeys: Partial<Record<OrderStatus, string>> = {
	[OrderStatus.COMPLETED]: 'options.completed',
	[OrderStatus.CANCELLED]: 'options.cancelled',
	[OrderStatus.REFUNDED]: 'options.refunded',
	[OrderStatus.PENDING_PAYMENT]: 'options.pendingPayment',
	[OrderStatus.PROCESSING]: 'options.processing',
	[OrderStatus.REQUIRES_ACTION]: 'options.requiresAction',
};

const sumColumn = (rows: TableRow<SummBillTableRow>[], key: NumericSummColumnKey) => rows.reduce((total, row) => total + (row.original[key] ?? 0), 0);
const footerCurrency = (rows: TableRow<SummBillTableRow>[]) => rows[0]?.original.currency_code ?? 'MYR';

const createNumberColumn = (key: NumericSummColumnKey, label: string, optional = false): TableColumn<SummBillTableRow> => ({
	accessorKey: key,
	header: () => headerCell(label, 'right'),
	cell: ({ row }) => (optional ? optionalCell(row.original[key]) : numberCell(row.original[key] ?? 0)),
	footer: ({ column }) => numberCell(sumColumn(column.getFacetedRowModel().rows, key)),
});

const createMoneyColumn = (key: NumericSummColumnKey, label: string): TableColumn<SummBillTableRow> => ({
	accessorKey: key,
	header: () => headerCell(label, 'right'),
	cell: ({ row }) => optionalMoneyCell(row.original[key], row.original.currency_code),
	footer: ({ column }) => moneyCell(sumColumn(column.getFacetedRowModel().rows, key), footerCurrency(column.getFacetedRowModel().rows)),
});

export function getSummColumns(t: TranslateFn, countKey: SummCountKey): TableColumn<SummBillTableRow>[] {
	const useOptionalNumbers = countKey === 'total_orders';

	return [
		{
			accessorKey: 'biz_date',
			header: () => headerCell(t('table.bizDate')),
			cell: ({ row }) => h(UBadge, { variant: 'outline', color: 'primary' }, () => getFormattedDate(new Date(row.original.biz_date))),
			footer: () => h('div', { class: 'font-semibold text-default' }, t('pages.totalLabel')),
		},
		{
			accessorKey: 'currency_code',
			header: () => headerCell(t('table.currency')),
			cell: ({ row }) => h('div', { class: 'font-medium text-default' }, row.original.currency_code),
		},
		{
			accessorKey: 'status',
			header: () => headerCell(t('table.orderStatus')),
			cell: ({ row }) => {
				const status = row.original.status;

				if (!status) return mutedCell();

				return h(UBadge, { variant: 'subtle', color: getOrderStatusColor(status) ?? 'neutral', class: 'capitalize' }, () => t(statusLabelKeys[status] ?? status));
			},
		},
		createMoneyColumn('gross_amt', t('table.grossAmt')),
		createMoneyColumn('net_amt', t('table.netAmt')),
		createMoneyColumn('disc_amt', t('table.discountAmt')),
		createMoneyColumn('gross_amt_exc', t('table.grossAmtExc')),
		createMoneyColumn('net_amt_exc', t('table.netAmtExc')),
		createMoneyColumn('tax_amt_inc', t('table.taxAmtInc')),
		createMoneyColumn('tax_amt_exc', t('table.taxAmtExc')),
		createMoneyColumn('void_amt', t('table.voidAmt')),
		createMoneyColumn('adj_amt', t('table.adjAmt')),
		createNumberColumn(countKey, t(SUMM_COUNT_LABELS[countKey]), useOptionalNumbers),
		createNumberColumn('total_qty', t('table.totalItems'), useOptionalNumbers),
		createNumberColumn('total_voided_qty', t('pages.voidedLabel'), useOptionalNumbers),
	];
}
