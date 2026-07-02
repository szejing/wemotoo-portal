<template>
	<ZPagePanel id="settings-system-activity-logs" :title="$t('nav.activityLogs')" back-to="/settings/system">
		<template #toolbar>
			<ZSectionFilterActivityLogs />
		</template>

		<div class="space-y-6">
			<div class="flex flex-col sm:flex-row sm:items-center justify-end sm:justify-between gap-4">
				<p v-if="!initialize && !loading" class="text-sm text-muted">
					{{ $t('pages.showingActivityLogs', { total: total_activity_logs }) }}
				</p>
				<ZTableToolbar
					v-model="filter.page_size"
					v-model:selected-column-keys="selectedColumnKeys"
					:page-size-options="options_page_size"
					:export-enabled="false"
					:exporting="exporting"
					:column-options="columnOptions"
					@update:model-value="activityLogStore.updatePageSize"
				/>
			</div>

			<template v-if="initialize || loading">
				<div class="rounded-lg overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-700">
					<div class="grid grid-cols-4 gap-4 p-4">
						<USkeleton v-for="i in 4" :key="i" class="h-4 flex-1 min-w-0" />
					</div>
					<div v-for="i in 5" :key="i" class="grid grid-cols-4 gap-4 p-4 items-center">
						<USkeleton v-for="j in 4" :key="j" class="h-4 flex-1 min-w-0" />
					</div>
				</div>
			</template>

			<UCard v-else :ui="{ body: 'p-0 sm:p-0' }">
				<UTable :data="activity_logs" :columns="visibleColumns" :loading="loading">
					<template #empty>
						<div class="flex flex-col items-center justify-center py-12 gap-3">
							<UIcon :name="ICONS.LIST" class="w-12 h-12 text-gray-400" />
							<p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('pages.noActivityLogsFound') }}</p>
							<p class="text-xs text-gray-500 dark:text-gray-500">{{ $t('pages.tryAdjustingFilters') }}</p>
						</div>
					</template>
				</UTable>
			</UCard>

			<div
				v-if="!initialize && !loading && activity_logs.length > 0"
				class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3"
			>
				<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
					<div class="text-sm text-gray-700 dark:text-gray-300">
						{{
							$t('pages.showingToOf', {
								from: (filter.current_page - 1) * filter.page_size + 1,
								to: Math.min(filter.current_page * filter.page_size, total_activity_logs),
								total: total_activity_logs,
							})
						}}
					</div>
					<UPagination
						v-model="filter.current_page"
						:total="total_activity_logs"
						:page-size="filter.page_size"
						show-last
						show-first
						size="sm"
						@update:page="updatePage"
					/>
				</div>
			</div>
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { options_page_size } from '~/utils/options';
import { ACTIVITY_LOG_COLUMN_LABELS, getActivityLogColumns } from '~/utils/table-columns';
import { columnOptionsFromLabelMap } from '~/utils/table-columns/visibility';

const { t } = useI18n();
const activityLogStore = useActivityLogStore();
const { activity_logs, total_activity_logs, filter, loading, exporting } = storeToRefs(activityLogStore);

const activityLogColumns = computed(() => getActivityLogColumns(t));
const columnOptions = computed(() => columnOptionsFromLabelMap(t, ACTIVITY_LOG_COLUMN_LABELS));
const { selectedColumnKeys, visibleColumns } = useTableColumnVisibility(activityLogColumns, columnOptions);
const initialize = ref(true);

useHead({ title: () => t('pages.activityLogsTitle') });

onMounted(async () => {
	initialize.value = true;
	try {
		await activityLogStore.getActivityLogs();
	} finally {
		initialize.value = false;
	}
});

const updatePage = async (page: number) => {
	await activityLogStore.updatePage(page);
};
</script>
