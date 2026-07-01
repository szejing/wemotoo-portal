<template>
	<ZPagePanel id="products-listing" :title="$t('nav.products')" back-to="/products">
		<template #navbar-right>
			<div class="flex flex-wrap items-center gap-2">
				<ZImportActions
					:downloading-template="downloading_template"
					:importing="importing"
					:accept="PRODUCT_IMPORT_ACCEPT"
					:is-allowed-file="isAllowedProductImportFile"
					:format-error-message="PRODUCT_IMPORT_FORMAT_ERROR_MESSAGE"
					@download-template="downloadProductImportTemplate"
					@import="importProductFile"
				/>
				<ZCreateButton to="/products/create" :label="$t('common.addProduct')" />
			</div>
		</template>
		<template #toolbar>
			<ZSectionFilterProducts />
		</template>
		<div class="space-y-6">
			<!-- Table Controls -->
			<ZTableToolbar
				v-model="filter.page_size"
				v-model:selected-column-keys="selectedColumnKeys"
				:page-size-options="options_page_size"
				:export-enabled="true"
				:exporting="exporting"
				:column-options="columnOptions"
				@update:model-value="updatePageSize"
				@export="exportProducts"
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
				<UTable :data="products" :columns="visibleColumns" :loading="loading" @select="selectProduct">
					<template #empty>
						<div class="flex flex-col items-center justify-center py-12 gap-3">
							<UIcon :name="ICONS.PRODUCT" class="w-12 h-12 text-gray-400" />
							<p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('pages.noProductsFound') }}</p>
							<p class="text-xs text-gray-500 dark:text-gray-500">{{ $t('pages.tryAdjustingFilters') }}</p>
						</div>
					</template>
				</UTable>
			</UCard>

			<div v-if="!initialize && products.length > 0" class="section-pagination">
				<UPagination v-model="filter.current_page" :items-per-page="filter.page_size" :total="total_products" @update:page="updatePage" />
			</div>
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { options_page_size } from '~/utils/options';
import { getProductColumns } from '~/utils/table-columns';
import { columnOptionsFromLabelMap } from '~/utils/table-columns/visibility';
import type { Product } from '~/utils/types/product';
import type { TableRow } from '@nuxt/ui';
import { ZModalImporting, ZModalLoading } from '#components';
import { PRODUCT_IMPORT_ACCEPT, PRODUCT_IMPORT_FORMAT_ERROR_MESSAGE, isAllowedProductImportFile } from '~/repository/modules/product/product';
import { ICONS } from '~/utils/icons';

const { t } = useI18n();
const productStore = useProductStore();
const overlay = useOverlay();
const loadingModal = overlay.create(ZModalLoading, { props: { key: 'loading' } });
const importLoadingModal = overlay.create(ZModalImporting, { props: { key: 'product-import-loading' } });

const PRODUCT_COLUMN_LABELS = {
	name: 'table.codeAndName',
	type: 'table.type',
	is_active: 'table.status',
	updated_at: 'table.lastUpdated',
	price_types: 'table.price',
} as const;

const product_columns = computed(() => getProductColumns(t));
const columnOptions = computed(() => columnOptionsFromLabelMap(t, PRODUCT_COLUMN_LABELS));
const { selectedColumnKeys, visibleColumns } = useTableColumnVisibility(product_columns, columnOptions);
useHead({ title: () => t('pages.productsTitle') });

const { products, loading, filter, total_products, exporting, updating, importing, downloading_template } = storeToRefs(productStore);
const initialize = ref(true);

onMounted(async () => {
	initialize.value = true;
	try {
		await productStore.getProducts();
	} finally {
		initialize.value = false;
	}
});

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

watch(
	() => exporting.value,
	(value: boolean) => {
		if (value) {
			loadingModal.open();
		} else {
			loadingModal.close();
		}
	},
);

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

const selectProduct = async (e: Event, row: TableRow<Product>) => {
	const product = row.original;
	if (!product) return;

	navigateTo(`/products/${product.code}`);
};

const updatePage = async (page: number) => {
	await productStore.updatePage(page);
};

const updatePageSize = async (size: number) => {
	await productStore.updatePageSize(size);
};

const exportProducts = async () => {
	await productStore.exportProducts();
};

const importProductFile = async (file: File) => {
	try {
		await productStore.importProducts(file);
	} catch {
		// Store action already shows the failure notification.
	}
};

const downloadProductImportTemplate = async () => {
	await productStore.downloadImportTemplate();
};
</script>

<style scoped></style>
