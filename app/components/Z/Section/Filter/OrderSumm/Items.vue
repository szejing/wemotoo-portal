<template>
	<div class="w-full">
		<!-- Compact Filter Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 items-center">
			<!-- Date Range Filter -->
			<div class="flex flex-col col-span-full gap-1.5">
				<label class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('components.filter.dateRange') }}</label>
				<ZDateRange v-model="filter.date_range" @update:model-value="handleDateRangeChange" />
			</div>

			<!-- Order Item Status Filter -->
			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('components.filter.itemStatus') }}</label>
				<ZSelectMenuOrderItemStatus v-model:status="filter.item_status" @update:model-value="handleItemStatusChange" />
			</div>

			<!-- Currency Filter -->
			<!-- <div class="flex flex-col gap-1.5">
				<label class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('components.filter.currency') }}</label>
				<ZSelectMenuCurrency v-model:currency-code="filter.currency_code" @update:model-value="handleCurrencyChange" />
			</div> -->

			<!-- Actions -->
			<div class="flex flex-col gap-1.5 col-span-full">
				<div class="flex gap-2">
					<UButton variant="outline" color="neutral" :disabled="is_loading" @click="clearFilters">
						<UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
						{{ $t('components.filter.clear') }}
					</UButton>
					<UButton color="primary" :disabled="is_loading" :loading="is_loading" @click="search">
						<UIcon :name="ICONS.SEARCH_ROUNDED" class="w-4 h-4" />
						{{ $t('components.filter.search') }}
					</UButton>
				</div>
			</div>
		</div>

		<!-- Active Filters Display -->
		<div v-if="hasActiveFilters" class="flex flex-wrap gap-2 items-center">
			<span class="text-xs text-gray-600 dark:text-gray-400">{{ $t('components.filter.activeFilters') }}</span>
			<UBadge v-if="filter.date_range.start || filter.date_range.end" color="primary" variant="subtle" size="sm" @click="clearFilter('date')">
				{{ $t('components.filter.date') }}:
				{{ formatDateRange(filter.date_range) }}
				<UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1 cursor-pointer" />
			</UBadge>
			<UBadge v-if="filter.item_status" color="info" variant="subtle" size="sm" @click="clearFilter('item_status')">
				{{ $t('components.filter.itemStatus') }}:
				{{ capitalizeFirstLetter(filter.item_status) }}
				<UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1 cursor-pointer" />
			</UBadge>
			<UBadge v-if="filter.currency_code && filter.currency_code !== 'MYR'" color="warning" variant="subtle" size="sm" @click="clearFilter('currency')">
				{{ $t('components.filter.currency') }}: {{ filter.currency_code }}
				<UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1 cursor-pointer" />
			</UBadge>
		</div>
	</div>
</template>

<script lang="ts" setup>
import type { Range } from '~/utils/interface';
import { format } from 'date-fns';

const orderSummStore = useSummOrderStore();
const { order_summ_item } = storeToRefs(orderSummStore);
const filter = computed(() => order_summ_item.value.filter);

const is_loading = computed(() => order_summ_item.value.loading);

const hasActiveFilters = computed(() => {
	return (
		filter.value.date_range.start ||
		filter.value.date_range.end ||
		filter.value.item_status ||
		(filter.value.currency_code && filter.value.currency_code !== 'MYR')
	);
});

const formatDateRange = (range: Range) => {
	if (!range) return '';
	const startDate = range.start ? format(new Date(range.start), 'dd/MM/yyyy') : '';
	const endDate = range.end ? format(new Date(range.end), 'dd/MM/yyyy') : '';
	if (startDate && endDate) {
		return `${startDate} - ${endDate}`;
	}
	return startDate || endDate;
};

const search = async () => {
	await orderSummStore.getOrderItemSummary();
};

const handleDateRangeChange = async (newValue: Range) => {
	filter.value.date_range.start = newValue.start ? new Date(newValue.start) : new Date();
	filter.value.date_range.end = newValue.end ? new Date(newValue.end) : undefined;
	await search();
};

const handleItemStatusChange = async () => {
	await search();
};

const clearFilters = async () => {
	filter.value.date_range.start = new Date();
	filter.value.date_range.end = undefined;
	filter.value.item_status = undefined;
	filter.value.currency_code = 'MYR';
	order_summ_item.value.current_page = 1;
	await search();
};

const clearFilter = async (filterKey: string) => {
	if (filterKey === 'date') {
		filter.value.date_range.start = new Date();
		filter.value.date_range.end = undefined;
	} else if (filterKey === 'item_status') {
		filter.value.item_status = undefined;
	} else if (filterKey === 'currency') {
		filter.value.currency_code = 'MYR';
	}
	await search();
};
</script>

<style scoped></style>
