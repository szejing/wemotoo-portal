<template>
	<ZPagePanel id="crm-users" :title="$t('nav.staffs')" back-to="/operation">
		<template #navbar-right>
			<ZCreateButton to="/operation/staff/create" :label="$t('common.addStaff')" />
		</template>
		<template #toolbar>
			<ZSectionFilterCrmUsers />
		</template>

		<div class="space-y-6">
			<!-- Table controls: page size -->
			<ZTableToolbar
				v-model="filter.page_size"
				v-model:selected-column-keys="selectedColumnKeys"
				:page-size-options="options_page_size"
				:export-enabled="false"
				:column-options="columnOptions"
				@update:model-value="updatePageSize"
			/>

			<template v-if="initialize">
				<div class="rounded-lg overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-700">
					<div class="grid grid-cols-5 gap-4 p-4">
						<USkeleton v-for="i in 5" :key="i" class="h-4 flex-1 min-w-0" />
					</div>
					<div v-for="i in 5" :key="i" class="grid grid-cols-5 gap-4 p-4 items-center">
						<USkeleton v-for="j in 5" :key="j" class="h-4 flex-1 min-w-0" />
					</div>
				</div>
			</template>

			<UCard v-else :ui="{ body: 'p-0 sm:p-0' }">
				<UTable :data="crm_users" :columns="visibleColumns" :loading="loading" :ui="{ tr: 'cursor-pointer' }" @select="selectCrmUser">
					<template #empty>
						<div class="flex flex-col items-center justify-center py-12 gap-3">
							<UIcon name="i-heroicons-user-group" class="w-12 h-12 text-gray-400" />
							<p class="text-sm text-gray-600 dark:text-gray-400">
								{{ $t('pages.noCrmUsersFound') }}
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-500">
								{{ $t('pages.tryAdjustingSearch') }}
							</p>
						</div>
					</template>
				</UTable>
			</UCard>

			<!-- Pagination -->
			<div v-if="!initialize && crm_users.length > 0" class="section-pagination">
				<UPagination v-model="filter.current_page" :items-per-page="filter.page_size" :total="total_count" @update:page="updatePage" />
			</div>
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { options_page_size } from '~/utils/options';
import { getCrmUserColumns } from '~/utils/table-columns';
import { columnOptionsFromLabelMap } from '~/utils/table-columns/visibility';
import type { CRMUser } from '~/utils/types/crm-user';
import type { TableRow } from '@nuxt/ui';
import { useCRMUserStore } from '~/stores/CRMUser/CRMUser';
import { ZModalLoading } from '#components';

const CRM_USER_COLUMN_LABELS = {
	row_index: 'table.noLabel',
	name: 'table.name',
	phone_no: 'table.phone',
	role: 'table.role',
	staff_department_id: 'table.staffDepartment',
	is_active: 'common.status',
} as const;

const { t } = useI18n();
const crm_user_columns = computed(() => getCrmUserColumns(t));
const columnOptions = computed(() => columnOptionsFromLabelMap(t, CRM_USER_COLUMN_LABELS));
const { selectedColumnKeys, visibleColumns } = useTableColumnVisibility(crm_user_columns, columnOptions);
useHead({ title: () => t('pages.crmUsersTitle') });

const crmUserStore = useCRMUserStore();
const overlay = useOverlay();
const loadingModal = overlay.create(ZModalLoading, {
	props: { key: 'loading' },
});
const { loading, updating, crm_users, filter, total_count } = storeToRefs(crmUserStore);

watch(
	() => updating.value,
	(value: boolean) => {
		if (value) {
			loadingModal.open();
		} else {
			loadingModal.close();
		}
	},
);

const selectCrmUser = (_e: Event, row: TableRow<CRMUser>) => {
	const user = row.original;
	if (!user?.id) return;
	navigateTo(`/operation/staff/${encodeURIComponent(user.id)}`);
};

const updatePage = async (page: number) => {
	await crmUserStore.updatePage(page);
};

const updatePageSize = async (size: number) => {
	await crmUserStore.updatePageSize(size);
};

const initialize = ref(true);

onMounted(async () => {
	initialize.value = true;
	try {
		await crmUserStore.getCrmUsers();
	} finally {
		initialize.value = false;
	}
});
</script>

<style scoped></style>
