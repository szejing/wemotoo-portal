<template>
	<ZPagePanel id="analytics-orders-items" :title="$t('pages.analyticsOrdersItems')" back-to="/analytics/orders">
		<template #toolbar>
			<ZSectionFilterOrderSummItems />
		</template>

		<div class="space-y-6">
			<ZTableToolbar
				v-model="order_summ_item.page_size"
				v-model:selected-column-keys="selectedColumnKeys"
				:page-size-options="options_page_size"
				:export-enabled="true"
				:exporting="order_summ_item.exporting"
				:column-options="columnOptions"
				@update:model-value="updatePageSize"
				@export="exportToCsv"
			/>

			<UCard v-if="groupedByDate.length === 0" class="overflow-hidden">
				<UTable :data="[]" :columns="visibleColumns" :loading="is_loading" :ui="orderItemTableUi">
					<template #empty>
						<div class="flex flex-col items-center justify-center py-12 gap-3">
							<UIcon :name="ICONS.REPORT_ORDER" class="w-12 h-12 text-gray-400" />
							<p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('pages.noOrderItemSummaryFound') }}</p>
							<p class="text-xs text-gray-500 dark:text-gray-500">{{ $t('pages.tryAdjustingFilters') }}</p>
						</div>
					</template>
				</UTable>
			</UCard>

			<UCard
				v-for="group in groupedByDate"
				:key="group.date"
				class="overflow-hidden"
				:ui="{
					header: 'bg-elevated/40 px-4 py-3 sm:px-6',
					body: 'p-0 sm:p-0',
				}"
			>
				<template #header>
					<ZAnalyticsItemDateSummary
						:date="group.date"
						:primary-count="group.total_orders"
						:primary-stat-label="$t('table.totalOrders')"
						:active-qty="group.active_qty"
						:voided-qty="group.voided_qty"
						:net-amt="group.net_amt"
						:currency-code="group.currency_code"
					/>
				</template>

				<UTable :data="group.items" :columns="visibleColumns" :loading="is_loading" :ui="orderItemTableUi" />
			</UCard>

			<div v-if="data.length > 0" class="section-pagination">
				<UPagination v-model="current_page" :items-per-page="order_summ_item.page_size" :total="order_summ_item.total_data" @update:page="updatePage" />
			</div>
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { OrderItemStatus } from 'yeppi-common';
import { getSummItemColumns, getSummItemColumnLabels } from '~/utils/table-columns';
import type { SummOrderItem } from '~/utils/types/summ-orders';
import { columnOptionsFromLabelMap } from '~/utils/table-columns/visibility';
import { options_page_size } from '~/utils/options';

const route = useRoute();
const { t } = useI18n();
const summ_item_columns = computed(() => getSummItemColumns<SummOrderItem>(t, 'total_orders'));
const columnOptions = computed(() => columnOptionsFromLabelMap(t, getSummItemColumnLabels('total_orders')));
const { selectedColumnKeys, visibleColumns } = useTableColumnVisibility(summ_item_columns, columnOptions);
useHead({ title: () => t('pages.orderItemSummary') });

const orderSummStore = useSummOrderStore();
const { order_summ_item } = storeToRefs(orderSummStore);
const orderItemTableUi = {
	root: 'relative overflow-auto',
	base: 'min-w-[1180px]',
	th: 'whitespace-nowrap',
	td: 'whitespace-nowrap',
	tfoot: 'bg-elevated/50 border-t border-default',
} as const;

const VALID_ITEM_STATUSES = new Set(Object.values(OrderItemStatus));

function applyQueryToFilter() {
	const start = route.query.start_date;
	const end = route.query.end_date;
	const itemStatus = route.query.item_status;
	if (typeof start === 'string' && start) {
		const d = new Date(start);
		if (!Number.isNaN(d.getTime())) {
			orderSummStore.order_summ_item.filter.date_range.start = d;
		}
	}
	if (typeof end === 'string' && end) {
		const d = new Date(end);
		if (!Number.isNaN(d.getTime())) {
			orderSummStore.order_summ_item.filter.date_range.end = d;
		}
	}
	if (typeof itemStatus === 'string' && VALID_ITEM_STATUSES.has(itemStatus as OrderItemStatus)) {
		orderSummStore.order_summ_item.filter.item_status = itemStatus as OrderItemStatus;
	}
}

onMounted(async () => {
	applyQueryToFilter();
	await orderSummStore.getOrderItemSummary();
});

watch(
	() => ({ start: route.query.start_date, end: route.query.end_date, item_status: route.query.item_status }),
	() => {
		applyQueryToFilter();
		orderSummStore.getOrderItemSummary();
	},
	{ deep: true },
);
const current_page = computed({
	get: () => order_summ_item.value.current_page,
	set: (page: number) => {
		order_summ_item.value.current_page = page;
	},
});

const is_loading = computed(() => order_summ_item.value.loading);
const data = computed(() => order_summ_item.value.data);

// Group data by date
const groupedByDate = computed(() => {
	const grouped: { [key: string]: (typeof data.value)[0][] } = {};

	data.value.forEach((item) => {
		const date = new Date(item.biz_date).toISOString().split('T')[0] as string;
		if (!grouped[date]) {
			grouped[date] = [];
		}
		grouped[date].push(item);
	});

	return Object.entries(grouped).map(([date, items]) => {
		const totals = items.reduce(
			(acc, item) => {
				acc.total_orders += item.total_orders;
				acc.total_qty += item.total_qty;
				acc.gross_amt += item.gross_amt;
				acc.net_amt += item.net_amt;
				acc.currency_code = item.currency_code;

				// Separate voided and non-voided quantities
				if (item.item_status === OrderItemStatus.VOIDED) {
					acc.voided_qty += item.total_qty;
				} else {
					acc.active_qty += item.total_qty;
				}
				return acc;
			},
			{ total_orders: 0, total_qty: 0, gross_amt: 0, net_amt: 0, voided_qty: 0, active_qty: 0, currency_code: 'MYR' },
		);

		return {
			date,
			items,
			...totals,
		};
	});
});

const updatePage = async (page: number) => {
	order_summ_item.value.current_page = page;
	await orderSummStore.getOrderItemSummary();
};

const updatePageSize = async (size: number) => {
	await orderSummStore.updateOrderItemSummPageSize(size);
};

const exportToCsv = async () => {
	await orderSummStore.exportOrderItemSummary();
};
</script>

<style scoped>
/* `tr:last-child` would wrongly match the last tbody row; footer lives in tfoot */
:deep(tfoot tr) {
	background-color: rgb(249 250 251);
	border-top: 2px solid rgb(209 213 219);
}

:deep(table) {
	table-layout: fixed;
}

:deep(th:nth-child(1)),
:deep(td:nth-child(1)) {
	width: 30%;
}

:deep(th:nth-child(2)),
:deep(td:nth-child(2)) {
	width: 18%;
}

:deep(th:nth-child(3)),
:deep(td:nth-child(3)) {
	width: 17%;
}

:deep(th:nth-child(4)),
:deep(td:nth-child(4)) {
	width: 17%;
}

:deep(th:nth-child(5)),
:deep(td:nth-child(5)) {
	width: 18%;
}
</style>
