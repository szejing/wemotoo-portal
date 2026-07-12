<template>
	<ZPagePanel id="customers" :title="$t('nav.customers')">
		<template #navbar-right>
			<ZImportActions
				:downloading-template="processing"
				:importing="importing"
				:accept="CUSTOMER_IMPORT_ACCEPT"
				:is-allowed-file="isAllowedCustomerImportFile"
				:format-error-message="CUSTOMER_IMPORT_FORMAT_ERROR_MESSAGE"
				@download-template="downloadCustomerImportTemplate"
				@import="importCustomerFile"
			/>
		</template>
		<template #toolbar>
			<ZSectionFilterCustomers />
		</template>
		<div class="space-y-6">
			<!-- Table Controls -->
			<ZTableToolbar
				v-model="filter.page_size"
				v-model:selected-column-keys="selectedColumnKeys"
				:page-size-options="options_page_size"
				:export-enabled="false"
				:exporting="customerStore.exporting"
				:column-options="columnOptions"
				@update:model-value="updatePageSize"
				@export="exportCustomers"
			/>

			<template v-if="initialize">
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
				<UTable :data="customers" :columns="visibleColumns" :loading="loading" @select="selectCustomer">
					<template #empty>
						<div class="flex flex-col items-center justify-center py-12 gap-3">
							<UIcon name="i-heroicons-user-group" class="w-12 h-12 text-gray-400" />
							<p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('pages.noCustomersFound') }}</p>
							<p class="text-xs text-gray-500 dark:text-gray-500">{{ $t('pages.tryAdjustingFilters') }}</p>
						</div>
					</template>
				</UTable>
			</UCard>

			<div v-if="!initialize && customers.length > 0" class="section-pagination">
				<UPagination v-model="filter.current_page" :items-per-page="filter.page_size" :total="total_customers" @update:page="updatePage" />
			</div>
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { options_page_size } from '~/utils/options';
import { getCustomerColumns } from '~/utils/table-columns';
import { columnOptionsFromLabelMap } from '~/utils/table-columns/visibility';
import type { Customer } from '~/utils/types/customer';
import type { TableRow } from '@nuxt/ui';
import { ZModalImporting } from '#components';
import { CUSTOMER_IMPORT_ACCEPT, CUSTOMER_IMPORT_FORMAT_ERROR_MESSAGE, isAllowedCustomerImportFile } from '~/repository/modules/customer/customer';

const CUSTOMER_COLUMN_LABELS = {
	row_index: 'table.noLabel',
	name: 'table.name',
	email_address: 'table.email',
	phone_number: 'table.phone',
} as const;

const { t } = useI18n();
const customer_columns = computed(() => getCustomerColumns(t));
const columnOptions = computed(() => columnOptionsFromLabelMap(t, CUSTOMER_COLUMN_LABELS));
const { selectedColumnKeys, visibleColumns } = useTableColumnVisibility(customer_columns, columnOptions);
useHead({ title: () => t('pages.customersTitle') });

const customerStore = useCustomerStore();
const { loading, customers, filter, total_customers, exporting, importing, processing } = storeToRefs(customerStore);
const initialize = ref(true);
const overlay = useOverlay();
const importLoadingModal = overlay.create(ZModalImporting, { props: { key: 'customer-import-loading' } });

onMounted(async () => {
	initialize.value = true;
	try {
		await customerStore.getCustomers();
	} finally {
		initialize.value = false;
	}
});

watch(
	() => importing.value,
	(value: boolean) => {
		if (value) {
			importLoadingModal.open();
		} else {
			importLoadingModal.close();
		}
	},
);

const selectCustomer = async (e: Event, row: TableRow<Customer>) => {
	const customer = row.original;
	if (!customer) return;

	navigateTo(`/customers/${encodeURIComponent(customer.customer_no)}`);
};

const updatePage = async (page: number) => {
	await customerStore.updatePage(page);
};

const updatePageSize = async (size: number) => {
	await customerStore.updatePageSize(size);
};

const exportCustomers = async () => {
	await customerStore.exportCustomers();
};

const importCustomerFile = async (file: File) => {
	try {
		await customerStore.importCustomers(file);
	} catch {
		// Store action already shows the failure notification.
	}
};

const downloadCustomerImportTemplate = async () => {
	await customerStore.downloadImportTemplate();
};
</script>

<style scoped></style>
