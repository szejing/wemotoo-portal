import type { OrderItemStatus } from 'yeppi-common';
import { options_page_size } from '~/utils/options';
import type { SummOrderItem } from '~/utils/types/summ-orders';
import type { Range } from '~/utils/interface';
import { sub } from 'date-fns';

type OrderSummItem = {
	filter: {
		date_range: Range;
		item_status: OrderItemStatus | undefined;
		currency_code: string;
	};
	exporting: boolean;
	loading: boolean;
	page_size: number;
	current_page: number;
	total_data: number;
	data: SummOrderItem[];
};

export const initialEmptyOrderSummItem: OrderSummItem = {
	filter: {
		date_range: {
			start: sub(new Date(), { days: 14 }),
			end: new Date(),
		},
		item_status: undefined,
		currency_code: 'MYR',
	},
	exporting: false,
	loading: false,
	page_size: options_page_size[0] as number,
	current_page: 1,
	total_data: 0,
	data: [],
};
