<template>
	<ZPagePanel id="payment-methods" :title="$t('nav.paymentMethods')" back-to="/settings/payment">
		<template #toolbar>
			<ZSectionFilterPaymentMethods />
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
				@export="exportPaymentMethods"
			/>

			<template v-if="initialize">
				<div class="rounded-lg overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-700">
					<div class="grid grid-cols-[1fr_auto] gap-4 p-4">
						<USkeleton class="h-4 w-24" />
						<USkeleton class="h-4 w-16" />
					</div>
					<div v-for="i in 5" :key="i" class="grid grid-cols-[1fr_auto] gap-4 p-4 items-center">
						<USkeleton class="h-4 w-40" />
						<USkeleton class="h-4 w-12" />
					</div>
				</div>
			</template>
			<UTable v-else :data="payment_methods" :columns="visibleColumns" :loading="loading" @select="selectPaymentMethod">
				<template #empty>
					<div class="flex flex-col items-center justify-center py-12 gap-3">
						<UIcon :name="ICONS.PAYMENT_METHODS" class="w-12 h-12 text-gray-400" />
						<p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('pages.noPaymentMethodsFound') }}</p>
						<p class="text-xs text-gray-500 dark:text-gray-500">{{ $t('pages.tryAdjustingFilters') }}</p>
					</div>
				</template>
			</UTable>

			<div v-if="!initialize && payment_methods.length > 0" class="section-pagination">
				<UPagination v-model="filter.current_page" :items-per-page="filter.page_size" :total="total_payment_methods" @update:page="updatePage" />
			</div>
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { ZModalLoading, ZModalPaymentMethodDetail } from '#components';
import type { TableRow } from '@nuxt/ui';
import { options_page_size } from '~/utils/options';
import type { UpdatePaymentMethodBody } from '~/repository/modules/payment-method/models/request/update-payment-method.req';
import { getPaymentMethodColumns } from '~/utils/table-columns';
import { columnOptionsFromLabelMap } from '~/utils/table-columns/visibility';
import type { PaymentMethod } from '~/utils/types/payment-method';

const PAYMENT_METHOD_COLUMN_LABELS = {
	code: 'table.code',
	active: 'table.active',
} as const;

const { t } = useI18n();
const payment_method_columns = computed(() => getPaymentMethodColumns(t));
const columnOptions = computed(() => columnOptionsFromLabelMap(t, PAYMENT_METHOD_COLUMN_LABELS));
const { selectedColumnKeys, visibleColumns } = useTableColumnVisibility(payment_method_columns, columnOptions);
useHead({ title: () => t('pages.paymentMethodsTitle') });

const overlay = useOverlay();
const paymentMethodStore = usePaymentMethodStore();
const { payment_methods, filter, total_payment_methods, loading, exporting, updating } = storeToRefs(paymentMethodStore);
const initialize = ref(true);

onMounted(async () => {
	initialize.value = true;
	try {
		await paymentMethodStore.getPaymentMethods();
	} finally {
		initialize.value = false;
	}
});
const loadingModal = overlay.create(ZModalLoading, { props: { key: 'loading' } });

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

const updatePage = async (page: number) => {
	await paymentMethodStore.updatePage(page);
};

const updatePageSize = async (size: number) => {
	await paymentMethodStore.updatePageSize(size);
};

const selectPaymentMethod = async (_e: Event, row: TableRow<PaymentMethod>) => {
	const paymentMethod = row.original;
	if (!paymentMethod) return;

	const paymentMethodModal = overlay.create(ZModalPaymentMethodDetail, {
		props: {
			paymentMethod: JSON.parse(JSON.stringify(paymentMethod)),
			onUpdate: async (payload: UpdatePaymentMethodBody) => {
				await paymentMethodStore.updatePaymentMethod(paymentMethod.code, payload);
				paymentMethodModal.close();
			},
			onCancel: () => {
				paymentMethodModal.close();
			},
		},
	});

	paymentMethodModal.open();
};

const exportPaymentMethods = async () => {
	await paymentMethodStore.exportPaymentMethods();
};
</script>

<style scoped></style>
