<template>
	<div class="w-full">
		<div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
			<div class="flex flex-col col-span-full gap-1.5">
				<label class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('components.filter.dateRange') }}</label>
				<ZDateRange v-model="filter.date_range" @update:model-value="handleDateRangeChange" />
			</div>

			<div class="flex flex-col col-span-2 gap-1.5">
				<label class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('components.filter.search') }}</label>
				<UInput v-model="filter.query" :placeholder="$t('components.filter.searchActivityLogs')" :icon="ICONS.SEARCH_ROUNDED" @input="debouncedSearch" />
			</div>

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('table.action') }}</label>
				<USelect
					:model-value="actionSelectValue"
					:items="actionItems"
					value-attribute="value"
					color="neutral"
					variant="outline"
					class="w-full"
					:ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform' }"
					@update:model-value="onActionChange"
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('table.actor') }}</label>
				<USelect
					:model-value="actorTypeSelectValue"
					:items="actorTypeItems"
					value-attribute="value"
					color="neutral"
					variant="outline"
					class="w-full"
					:ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform' }"
					@update:model-value="onActorTypeChange"
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('table.source') }}</label>
				<USelect
					:model-value="sourceSelectValue"
					:items="sourceItems"
					value-attribute="value"
					color="neutral"
					variant="outline"
					class="w-full"
					:ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform' }"
					@update:model-value="onSourceChange"
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('table.visibility') }}</label>
				<USelect
					:model-value="visibilitySelectValue"
					:items="visibilityItems"
					value-attribute="value"
					color="neutral"
					variant="outline"
					class="w-full"
					:ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform' }"
					@update:model-value="onVisibilityChange"
				/>
			</div>

			<div class="flex flex-col gap-1.5 justify-end">
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

		<div v-if="hasActiveFilters" class="flex flex-wrap gap-2 items-center">
			<span class="text-xs text-gray-600 dark:text-gray-400">{{ $t('components.filter.activeFilters') }}</span>
			<UBadge v-if="hasDateFilter" color="primary" variant="subtle" size="sm" @click="clearFilter('date')">
				{{ $t('components.filter.date') }}: {{ formatDateRange(filter.date_range) }}
				<UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1 cursor-pointer" />
			</UBadge>
			<UBadge v-if="filter.query" color="info" variant="subtle" size="sm" @click="clearFilter('query')">
				{{ $t('components.filter.search') }}: {{ filter.query }}
				<UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1 cursor-pointer" />
			</UBadge>
			<UBadge v-if="filter.action" color="warning" variant="subtle" size="sm" @click="clearFilter('action')">
				{{ $t('table.action') }}: {{ getActivityLogActionLabel(t, filter.action) }}
				<UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1 cursor-pointer" />
			</UBadge>
			<UBadge v-if="filter.actor_type" color="neutral" variant="subtle" size="sm" @click="clearFilter('actor_type')">
				{{ $t('table.actor') }}: {{ getActivityLogActorTypeLabel(t, filter.actor_type) }}
				<UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1 cursor-pointer" />
			</UBadge>
			<UBadge v-if="filter.source" color="neutral" variant="subtle" size="sm" @click="clearFilter('source')">
				{{ $t('table.source') }}: {{ getActivityLogSourceLabel(t, filter.source) }}
				<UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1 cursor-pointer" />
			</UBadge>
			<UBadge v-if="filter.visibility" color="neutral" variant="subtle" size="sm" @click="clearFilter('visibility')">
				{{ $t('table.visibility') }}: {{ getActivityLogVisibilityLabel(t, filter.visibility) }}
				<UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1 cursor-pointer" />
			</UBadge>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { format } from 'date-fns';
import {
	ACTIVITY_LOG_FILTER_ALL,
	getActivityLogActionLabel,
	getActivityLogActionOptions,
	getActivityLogActorTypeLabel,
	getActivityLogActorTypeOptions,
	getActivityLogSourceLabel,
	getActivityLogSourceOptions,
	getActivityLogVisibilityLabel,
	getActivityLogVisibilityOptions,
} from '~/utils/options';
import type { ActivityLogAction, ActivityLogActorType, ActivityLogSource, ActivityLogVisibility } from '~/utils/types/activity-log';
import type { Range } from '~/utils/interface';

const { t } = useI18n();
const activityLogStore = useActivityLogStore();
const { filter } = storeToRefs(activityLogStore);

const is_loading = computed(() => activityLogStore.loading);
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

const actionItems = computed(() => getActivityLogActionOptions(t));
const actorTypeItems = computed(() => getActivityLogActorTypeOptions(t));
const sourceItems = computed(() => getActivityLogSourceOptions(t));
const visibilityItems = computed(() => getActivityLogVisibilityOptions(t));

const actionSelectValue = computed(() => filter.value.action ?? ACTIVITY_LOG_FILTER_ALL);
const actorTypeSelectValue = computed(() => filter.value.actor_type ?? ACTIVITY_LOG_FILTER_ALL);
const sourceSelectValue = computed(() => filter.value.source ?? ACTIVITY_LOG_FILTER_ALL);
const visibilitySelectValue = computed(() => filter.value.visibility ?? ACTIVITY_LOG_FILTER_ALL);

const hasDateFilter = computed(() => filter.value.date_range && (filter.value.date_range.start || filter.value.date_range.end));
const hasActiveFilters = computed(
	() => filter.value.query || filter.value.action || filter.value.actor_type || filter.value.source || filter.value.visibility || hasDateFilter.value,
);

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
	filter.value.current_page = 1;
	await activityLogStore.getActivityLogs();
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

const onActionChange = async (value: string) => {
	filter.value.action = value === ACTIVITY_LOG_FILTER_ALL ? undefined : (value as ActivityLogAction);
	await search();
};

const onActorTypeChange = async (value: string) => {
	filter.value.actor_type = value === ACTIVITY_LOG_FILTER_ALL ? undefined : (value as ActivityLogActorType);
	await search();
};

const onSourceChange = async (value: string) => {
	filter.value.source = value === ACTIVITY_LOG_FILTER_ALL ? undefined : (value as ActivityLogSource);
	await search();
};

const onVisibilityChange = async (value: string) => {
	filter.value.visibility = value === ACTIVITY_LOG_FILTER_ALL ? undefined : (value as ActivityLogVisibility);
	await search();
};

const clearFilters = async () => {
	activityLogStore.resetFilters();
	await search();
};

const clearFilter = async (filterKey: string) => {
	if (filterKey === 'date') {
		filter.value.date_range = {};
	} else if (filterKey === 'query') {
		filter.value.query = '';
	} else if (filterKey === 'action') {
		filter.value.action = undefined;
	} else if (filterKey === 'actor_type') {
		filter.value.actor_type = undefined;
	} else if (filterKey === 'source') {
		filter.value.source = undefined;
	} else if (filterKey === 'visibility') {
		filter.value.visibility = undefined;
	}
	await search();
};

onUnmounted(() => {
	if (searchTimeout.value) {
		clearTimeout(searchTimeout.value);
	}
});
</script>
