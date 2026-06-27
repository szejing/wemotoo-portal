<template>
	<ZPagePanel id="vouchers-product-listing" :title="$t('nav.productVouchers')" back-to="/marketing">
		<template #navbar-right>
			<ZCreateButton to="/marketing/vouchers/product/create" :label="$t('common.create')" />
		</template>
		<template #toolbar>
			<ZSectionFilterVouchers />
		</template>

		<div class="space-y-6">
			<ZTableToolbar
				v-model="filter.page_size"
				v-model:selected-column-keys="selectedColumnKeys"
				:page-size-options="options_page_size"
				:export-enabled="true"
				:exporting="exporting"
				:column-options="columnOptions"
				@update:model-value="voucherStore.updatePageSize"
				@export="exportVouchers"
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
				<UTable :data="vouchers" :columns="visibleColumns" :loading="loading" @select="selectVoucher">
					<template #empty>
						<div class="flex flex-col items-center justify-center py-12 gap-3">
							<UIcon :name="ICONS.ADDITIONAL" class="w-12 h-12 text-gray-400" />
							<p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('pages.noVouchersFound') }}</p>
							<p class="text-xs text-gray-500 dark:text-gray-500">{{ $t('pages.tryAdjustingFilters') }}</p>
						</div>
					</template>
				</UTable>
			</UCard>

			<div v-if="!initialize && vouchers.length > 0" class="section-pagination">
				<UPagination v-model="filter.current_page" :items-per-page="filter.page_size" :total="total_vouchers" @update:page="updatePage" />
			</div>
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { AllocationType } from 'yeppi-common';
import { getVoucherColumns } from '~/utils/table-columns';
import { columnOptionsFromLabelMap } from '~/utils/table-columns/visibility';
import type { TableRow } from '@nuxt/ui';
import type { Voucher } from '~/utils/types/voucher';
import { options_page_size } from '~/utils/options';
import { ICONS } from '~/utils/icons';
import { useVoucherStore } from '~/stores/voucher/voucher';

const VOUCHER_COLUMN_LABELS = {
	code: 'table.code',
	discount_code: 'table.linkedDiscount',
	usage_count: 'table.usage',
	status: 'common.status',
} as const;

const { t } = useI18n();
const voucher_columns = computed(() => getVoucherColumns(t));
const columnOptions = computed(() => columnOptionsFromLabelMap(t, VOUCHER_COLUMN_LABELS));
const { selectedColumnKeys, visibleColumns } = useTableColumnVisibility(voucher_columns, columnOptions);
useHead({ title: () => t('pages.productVouchersTitle') });

const voucherStore = useVoucherStore();
const { loading, vouchers, filter, total_vouchers, exporting } = storeToRefs(voucherStore);
const initialize = ref(true);
const router = useRouter();

onMounted(async () => {
	voucherStore.setListingAllocationFilter(AllocationType.ITEM);
	initialize.value = true;
	try {
		await voucherStore.getVouchers();
	} finally {
		initialize.value = false;
	}
});

const selectVoucher = async (_e: Event, row: TableRow<Voucher>) => {
	const voucher = row.original;
	if (!voucher) return;
	router.push(`/marketing/vouchers/${voucher.code}`);
};

const updatePage = async (page: number) => {
	await voucherStore.updatePage(page);
};

const exportVouchers = async () => {
	// await voucherStore.exportVouchers();
};
</script>

<style scoped></style>
