import { getFormattedDate, type OrderItemStatus } from 'yeppi-common';
import type { Range } from '~/utils/interface';

type SummOrderItemFilterInput = {
	date_range: Range;
	item_status?: OrderItemStatus;
	currency_code?: string;
};

export function buildSummOrderItemODataFilter(filter: SummOrderItemFilterInput): string {
	let odataFilter = '';

	if (filter.item_status) {
		odataFilter = `item_status eq '${filter.item_status}'`;
	}

	if (filter.currency_code) {
		const currencyFilter = `currency_code eq '${filter.currency_code}'`;
		odataFilter = odataFilter ? `${odataFilter} and ${currencyFilter}` : currencyFilter;
	}

	if (filter.date_range.end) {
		const dateFilter = `(biz_date between '${getFormattedDate(filter.date_range.start!, 'yyyy-MM-dd')}' and '${getFormattedDate(
			filter.date_range.end,
			'yyyy-MM-dd',
		)}')`;
		odataFilter = odataFilter ? `${odataFilter} and ${dateFilter}` : dateFilter;
	} else if (filter.date_range.start) {
		const dateFilter = `biz_date le '${getFormattedDate(filter.date_range.start, 'yyyy-MM-dd')}'`;
		odataFilter = odataFilter ? `${odataFilter} and ${dateFilter}` : dateFilter;
	}

	return odataFilter;
}
