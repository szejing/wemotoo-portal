<template>
	<ZPagePanel id="affiliates" :title="$t('nav.affiliates')">
		<template #navbar-right>
			<div class="flex items-center gap-2">
				<UButton variant="outline" color="neutral" @click="navigateTo('/marketing/affiliates/tiers')">
					{{ $t('affiliate.tiers') }}
				</UButton>
				<ZCreateButton :label="$t('affiliate.addAffiliate')" @click="createAffiliateOpen = true" />
			</div>
		</template>
		<template #toolbar>
			<ZSectionFilterAffiliates />
		</template>
		<div class="space-y-6">
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
					<div class="grid grid-cols-4 gap-4 p-4">
						<USkeleton v-for="i in 4" :key="i" class="h-4 flex-1 min-w-0" />
					</div>
					<div v-for="i in 5" :key="i" class="grid grid-cols-4 gap-4 p-4 items-center">
						<USkeleton v-for="j in 4" :key="j" class="h-4 flex-1 min-w-0" />
					</div>
				</div>
			</template>
			<UTable v-else :data="affiliates" :columns="visibleColumns" :loading="loading" @select="selectAffiliate">
				<template #empty>
					<div class="flex flex-col items-center justify-center py-12 gap-3">
						<UIcon name="i-heroicons-user-group" class="w-12 h-12 text-gray-400" />
						<p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('pages.noAffiliatesFound') }}</p>
						<p class="text-xs text-gray-500 dark:text-gray-500">{{ $t('pages.tryAdjustingSearch') }}</p>
					</div>
				</template>
			</UTable>

			<div v-if="!initialize && affiliates.length > 0" class="section-pagination">
				<UPagination v-model="filter.current_page" :items-per-page="filter.page_size" :total="total_count" @update:page="updatePage" />
			</div>
		</div>
		<AffiliateCreationModal v-model:open="createAffiliateOpen" />
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { options_page_size } from '~/utils/options';
import { getAffiliateColumns } from '~/utils/table-columns';
import { columnOptionsFromLabelMap } from '~/utils/table-columns/visibility';
import type { Affiliate } from '~/utils/types/affiliate';
import type { TableRow } from '@nuxt/ui';
import { useAffiliateStore } from '~/stores/Affiliate/Affiliate';
import { ZModalLoading } from '#components';

const AFFILIATE_COLUMN_LABELS = {
	row_index: 'table.noLabel',
	slug: 'affiliate.slug',
	tier: 'affiliate.tier',
	total_referrals_count: 'affiliate.referrals',
	current_balance: 'affiliate.balance',
	created_at: 'affiliate.createdAt',
} as const;

const { t } = useI18n();
const affiliate_columns = computed(() => getAffiliateColumns(t));
const columnOptions = computed(() => columnOptionsFromLabelMap(t, AFFILIATE_COLUMN_LABELS));
const { selectedColumnKeys, visibleColumns } = useTableColumnVisibility(affiliate_columns, columnOptions);
useHead({ title: () => t('pages.affiliatesTitle') });

const affiliateStore = useAffiliateStore();
const overlay = useOverlay();
const loadingModal = overlay.create(ZModalLoading, { props: { key: 'loading' } });
const { loading, updating, affiliates, filter, total_count } = storeToRefs(affiliateStore);
const createAffiliateOpen = ref(false);

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

const selectAffiliate = (_e: Event, row: TableRow<Affiliate>) => {
	const affiliate = row.original;
	if (!affiliate?.id) return;
	navigateTo(`/marketing/affiliates/${encodeURIComponent(affiliate.id)}`);
};

const updatePage = async (page: number) => {
	await affiliateStore.updatePage(page);
};

const updatePageSize = async (size: number) => {
	await affiliateStore.updatePageSize(size);
};

const initialize = ref(true);

onMounted(async () => {
	initialize.value = true;
	try {
		await affiliateStore.getAffiliates();
	} finally {
		initialize.value = false;
	}
});
</script>
