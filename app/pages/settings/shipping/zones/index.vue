<template>
	<ZPagePanel id="settings-shipping-zones-listing" :title="$t('pages.shippingZonesListingTitle')" back-to="/settings/shipping">
		<template #navbar-right>
			<ZCreateButton to="/settings/shipping/zones/create" :label="$t('common.create')" />
		</template>
		<template #toolbar>
			<ZSectionFilterShippingZones />
		</template>

		<div class="space-y-6">
			<ZTableToolbar
				v-model="filter.page_size"
				v-model:selected-column-keys="selectedColumnKeys"
				:page-size-options="options_page_size"
				:export-enabled="true"
				:exporting="exporting"
				:column-options="columnOptions"
				@update:model-value="zoneStore.updatePageSize"
				@export="exportShippingZones"
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
			<UTable v-else :data="getDisplayZones" :columns="visibleColumns" :loading="loading" @select="selectZone">
				<template #empty>
					<div class="flex flex-col items-center justify-center py-12 gap-3">
						<UIcon :name="ICONS.ADDITIONAL" class="w-12 h-12 text-gray-400" />
						<p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('pages.noShippingZonesFound') }}</p>
						<p class="text-xs text-gray-500 dark:text-gray-500">{{ $t('pages.tryAdjustingFilters') }}</p>
					</div>
				</template>
			</UTable>

			<div v-if="!initialize && getDisplayZones.length > 0" class="section-pagination">
				<UPagination v-model="filter.current_page" :items-per-page="filter.page_size" :total="total_shipping_zones" @update:page="updatePage" />
			</div>
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import type { TableRow } from '@nuxt/ui';
import { ICONS } from '~/utils/icons';
import { options_page_size } from '~/utils/options';
import { getShippingZoneColumns } from '~/utils/table-columns';
import { columnOptionsFromLabelMap } from '~/utils/table-columns/visibility';
import type { ShippingZone } from '~/utils/types/shipping-zone';

const SHIPPING_ZONE_COLUMN_LABELS = {
	region: 'table.shippingZoneRegion',
	pricing_summary: 'table.shippingZonePricing',
	is_active: 'common.status',
} as const;

const { t, locale, messages } = useI18n();
const zoneStore = useShippingZoneStore();
const { loading, getDisplayZones, total_shipping_zones, filter, exporting } = storeToRefs(zoneStore);

const initialize = ref(true);

const columns = computed(() => {
	// Rebuild when lazy locale messages finish loading (@nuxtjs/i18n lazy: true)
	void messages.value?.[locale.value];
	return getShippingZoneColumns(t);
});

const columnOptions = computed(() => [
	{ key: 'code_description', label: `${t('common.code')} / ${t('common.description')}` },
	...columnOptionsFromLabelMap(t, SHIPPING_ZONE_COLUMN_LABELS),
]);

const { selectedColumnKeys, visibleColumns } = useTableColumnVisibility(columns, columnOptions);

const selectZone = (_e: Event, row: TableRow<ShippingZone>) => {
	void navigateTo(`/settings/shipping/zones/${encodeURIComponent(row.original.code)}`);
};

const updatePage = async (page: number) => {
	await zoneStore.updatePage(page);
};

const exportShippingZones = async () => {
	await zoneStore.exportShippingZones();
};

useHead({ title: () => t('pages.shippingZonesPageTitle') });

onMounted(async () => {
	initialize.value = true;
	try {
		await zoneStore.getShippingZones();
	} finally {
		initialize.value = false;
	}
});
</script>

<style scoped></style>
