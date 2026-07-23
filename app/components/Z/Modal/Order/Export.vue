<template>
	<UModal
		v-model:open="isOpen"
		:title="$t('components.orderExport.title')"
		:ui="{ content: 'w-full sm:max-w-lg' }"
		:close="{
			onClick: () => {
				isOpen = false;
			},
		}"
		@update:open="onOpenChange"
	>
		<template #body>
			<div class="space-y-5">
				<div class="space-y-2">
					<label class="text-xs font-medium text-gray-700 dark:text-gray-300">
						{{ $t('components.orderExport.dateRange') }}
					</label>
					<ZDateRange v-model="form.date_range" hide-presets />
				</div>

				<ZSectionFilterStatuses
					v-model="selectedStatuses"
					:items="statusItems"
					:get-color="getOrderStatusColor"
					:placeholder="$t('components.selectMenu.selectOrderStatus')"
					show-label
					:label="$t('components.orderExport.statuses')"
				/>

				<div class="space-y-2">
					<label class="text-xs font-medium text-gray-700 dark:text-gray-300">
						{{ $t('components.orderExport.sortBy') }}
					</label>
					<USelect
						v-model="form.sort"
						:items="sortItems"
						value-key="value"
						color="neutral"
						variant="outline"
						class="w-full"
					/>
				</div>

				<UCheckbox
					v-model="form.include_item_details"
					:label="$t('components.orderExport.includeItemDetails')"
					:description="$t('components.orderExport.includeItemDetailsHint')"
				/>
			</div>
		</template>

		<template #footer>
			<div class="flex justify-between gap-4 w-full">
				<UButton color="neutral" variant="outline" @click="onCancel">
					{{ $t('common.cancel') }}
				</UButton>
				<UButton color="success" :loading="loading" @click="onExport">
					{{ $t('components.orderExport.export') }}
				</UButton>
			</div>
		</template>
	</UModal>
</template>

<script lang="ts" setup>
import { OrderStatus } from 'yeppi-common';
import { getDefaultOrderStatuses, getOrderStatusColor, getOrderStatusOptions } from '~/utils/options';
import {
	getDefaultOrderExportOptions,
	type OrderExportOptions,
	type OrderExportSortKey,
} from '~/utils/order-export';

const isOpen = ref(true);
const loading = ref(false);

const props = defineProps<{
	onConfirm?: (options: OrderExportOptions) => void | Promise<void>;
	onCancel?: () => void;
}>();

const { t } = useI18n();

const form = reactive<OrderExportOptions>({
	...getDefaultOrderExportOptions(),
	statuses: getDefaultOrderStatuses(),
});

const statusItems = computed(() => getOrderStatusOptions(t).filter((option) => option.value !== 'All'));

const selectedStatuses = computed({
	get() {
		return form.statuses as string[];
	},
	set(value: string[]) {
		form.statuses = value as OrderStatus[];
	},
});

const sortItems = computed(() => [
	{ label: t('components.orderExport.sortBizDateDesc'), value: 'biz_date_desc' as OrderExportSortKey },
	{ label: t('components.orderExport.sortBizDateAsc'), value: 'biz_date_asc' as OrderExportSortKey },
	{ label: t('components.orderExport.sortCreatedAtDesc'), value: 'created_at_desc' as OrderExportSortKey },
	{ label: t('components.orderExport.sortOrderNoAsc'), value: 'order_no_asc' as OrderExportSortKey },
]);

const onOpenChange = (open: boolean) => {
	if (!open) {
		props.onCancel?.();
	}
};

const onCancel = () => {
	isOpen.value = false;
	props.onCancel?.();
};

const onExport = async () => {
	if (loading.value) {
		return;
	}

	loading.value = true;

	try {
		await props.onConfirm?.({
			date_range: {
				start: form.date_range.start,
				end: form.date_range.end,
			},
			statuses: [...form.statuses],
			sort: form.sort,
			include_item_details: form.include_item_details,
		});
		isOpen.value = false;
	} finally {
		loading.value = false;
	}
};
</script>
