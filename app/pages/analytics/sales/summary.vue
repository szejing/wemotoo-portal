<template>
	<ZPagePanel id="analytics-sales-summary" :title="$t('pages.analyticsSalesSummary')" back-to="/analytics/sales">
		<template #toolbar>
			<ZSectionFilterSaleSumm />
		</template>

		<div class="space-y-6">
			<ZTableToolbar
				v-model="sale_summ.page_size"
				v-model:selected-column-keys="selectedColumnKeys"
				:page-size-options="options_page_size"
				:export-enabled="true"
				:exporting="sale_summ.exporting"
				:column-options="columnOptions"
				@update:model-value="updatePageSize"
				@export="salesSummStore.exportSalesSummary"
			/>

			<UCard class="overflow-hidden" :ui="{ body: 'p-0 sm:p-0' }">
				<UTable
					:data="rows"
					:columns="visibleDailyColumns"
					:loading="loading"
					:ui="{
						root: 'relative overflow-auto',
						base: 'min-w-[980px]',
						th: 'whitespace-nowrap',
						td: 'whitespace-nowrap',
						tfoot: 'bg-elevated/50 border-t border-default',
					}"
				>
					<template #empty>
						<div class="flex flex-col items-center justify-center py-12 gap-3">
							<UIcon :name="ICONS.REPORT_SALES" class="w-12 h-12 text-gray-400" />
							<p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('pages.noSalesSummaryFound') }}</p>
							<p class="text-xs text-gray-500 dark:text-gray-500">{{ $t('pages.tryAdjustingFilters') }}</p>
						</div>
					</template>
				</UTable>
			</UCard>

			<div v-if="data.length > 0" class="section-pagination">
				<UPagination v-model="current_page" :items-per-page="sale_summ.page_size" :total="sale_summ.total_data" @update:page="updatePage" />
			</div>
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { options_page_size } from '~/utils/options';
import { mapSummBillsToTableRows } from '~/utils/summ-bill-table-rows';
import { getSummColumns, getSummColumnLabels } from '~/utils/table-columns';
import { columnOptionsFromLabelMap } from '~/utils/table-columns/visibility';

const route = useRoute();
const { t } = useI18n();
useHead({ title: () => t('pages.saleSummaryTitle') });

const salesSummStore = useSummSaleStore();

function applyQueryToFilter() {
	const start = route.query.start_date;
	const end = route.query.end_date;
	if (typeof start === 'string' && start) {
		const d = new Date(start);
		if (!Number.isNaN(d.getTime())) {
			salesSummStore.sale_summ.filter.date_range.start = d;
		}
	}
	if (typeof end === 'string' && end) {
		const d = new Date(end);
		if (!Number.isNaN(d.getTime())) {
			salesSummStore.sale_summ.filter.date_range.end = d;
		}
	}
}

onMounted(async () => {
	applyQueryToFilter();
	await salesSummStore.getSaleSummary();
});

watch(
	() => route.query.start_date && route.query.end_date,
	() => {
		applyQueryToFilter();
		salesSummStore.getSaleSummary();
	},
);
const { sale_summ } = storeToRefs(salesSummStore);
const loading = computed(() => sale_summ.value.loading);

const data = computed(() => sale_summ.value.data);

const current_page = computed({
	get: () => sale_summ.value.current_page,
	set: (page: number) => {
		sale_summ.value.current_page = page;
	},
});

const saleSummColumns = computed(() => getSummColumns(t, 'total_txns'));
const columnOptions = computed(() => columnOptionsFromLabelMap(t, getSummColumnLabels('total_txns')));
const { selectedColumnKeys, visibleColumns: visibleDailyColumns } = useTableColumnVisibility(saleSummColumns, columnOptions, {
	defaultHiddenKeys: ['currency_code', 'total_voided_qty'],
});

const rows = computed(() =>
	mapSummBillsToTableRows(data.value, {
		// Status filter All (undefined) → keep one row per status for the day
		groupByStatus: !sale_summ.value.filter.status,
	}),
);

const updatePage = async (page: number) => {
	sale_summ.value.current_page = page;
	await salesSummStore.getSaleSummary();
};

const updatePageSize = async (size: number) => {
	await salesSummStore.updateSaleSummPageSize(size);
};

// const exportSalesSummary = async () => {
// 	await salesSummStore.exportSalesSummary();
// };
</script>

<style scoped>
:deep(tfoot tr) {
	font-weight: 600;
}
</style>
