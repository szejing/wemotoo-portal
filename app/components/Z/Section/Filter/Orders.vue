<template>
	<div class="w-full">
		<!-- Compact Filter Grid -->
		<div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
			<!-- Date Range Filter -->
			<div class="flex flex-col col-span-full gap-1.5">
				<label class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('components.filter.dateRange') }}</label>
				<ZDateRange v-model="filter.date_range" @update:model-value="handleDateRangeChange" />
			</div>

			<!-- Order Number Search -->
			<div class="flex flex-col col-span-2 gap-1.5">
				<label class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('components.filter.orderNo') }}</label>
				<UInput v-model="filter.query" :placeholder="$t('components.filter.searchOrderNo')" :icon="ICONS.SEARCH_ROUNDED" @input="debouncedSearch" />
			</div>

			<!-- Currency Filter -->
			<!-- <div class="flex flex-col col-span-2 sm:col-span-1 gap-1.5">
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
			<UBadge
				v-if="filter.date_range && (filter.date_range.start || filter.date_range.end)"
				color="primary"
				variant="subtle"
				size="sm"
				@click="clearFilter('date')"
			>
				{{ $t('components.filter.date') }}: {{ formatDateRange(filter.date_range) }}
				<UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1 cursor-pointer" />
			</UBadge>
			<UBadge v-if="filter.query" color="info" variant="subtle" size="sm" @click="clearFilter('query')">
				{{ $t('components.filter.order') }}: {{ filter.query }}
				<UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1 cursor-pointer" />
			</UBadge>
			<UBadge v-if="hasPartialStatusFilter" color="success" variant="subtle" size="sm" @click="clearFilter('status')">
				{{ $t('components.filter.status') }}: {{ statusBadgeLabel }}
				<UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1 cursor-pointer" />
			</UBadge>
			<UBadge v-if="filter.currency_code && filter.currency_code !== 'MYR'" color="warning" variant="subtle" size="sm">
				{{ $t('components.filter.currency') }}: {{ filter.currency_code }}
			</UBadge>
		</div>
	</div>
</template>

<script lang="ts" setup>
import type { Range } from '~/utils/interface';
import { sub, format } from 'date-fns';
import { getDefaultOrderStatuses, getOrderStatusOptions, isAllOrderStatusesSelected } from '~/utils/options';

const { t } = useI18n();
const orderStore = useOrderStore();
const { filter } = storeToRefs(orderStore);

const is_loading = computed(() => orderStore.loading);
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

const statusLabelMap = computed(() => {
	const map = new Map<string, string>();
	for (const option of getOrderStatusOptions(t)) {
		map.set(option.value, option.label);
	}
	return map;
});

const hasPartialStatusFilter = computed(() => filter.value.statuses.length > 0 && !isAllOrderStatusesSelected(filter.value.statuses));

const statusBadgeLabel = computed(() =>
	filter.value.statuses.map((status) => statusLabelMap.value.get(status) ?? capitalizeFirstLetter(status)).join(', '),
);

const hasActiveFilters = computed(() => {
	const hasDateFilter = filter.value.date_range && (filter.value.date_range.start || filter.value.date_range.end);
	return filter.value.query || hasPartialStatusFilter.value || (filter.value.currency_code && filter.value.currency_code !== 'MYR') || hasDateFilter;
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
	await orderStore.getOrders();
};

const debouncedSearch = () => {
	if (searchTimeout.value) {
		clearTimeout(searchTimeout.value);
	}
	searchTimeout.value = setTimeout(async () => {
		await search();
	}, 500);
};

const handleDateRangeChange = async (newValue: Range) => {
	filter.value.date_range = newValue;
	await search();
};

const clearFilters = async () => {
	filter.value.query = '';
	filter.value.statuses = getDefaultOrderStatuses();
	filter.value.currency_code = 'MYR';
	filter.value.date_range = {
		start: sub(new Date(), { days: 14 }),
		end: new Date(),
	};
	filter.value.current_page = 1;
	await search();
};

const clearFilter = async (filterKey: string) => {
	if (filterKey === 'query') {
		filter.value.query = '';
	} else if (filterKey === 'status') {
		filter.value.statuses = getDefaultOrderStatuses();
	} else if (filterKey === 'date') {
		filter.value.date_range = {
			start: sub(new Date(), { days: 14 }),
			end: new Date(),
		};
	}
	await search();
};

onUnmounted(() => {
	if (searchTimeout.value) {
		clearTimeout(searchTimeout.value);
	}
});
</script>

<style scoped></style>
