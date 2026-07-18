<template>
	<div class="mt-4 rounded-lg">
		<UCard
			:ui="{
				header: 'bg-elevated/40 px-4 py-3 sm:px-6',
				body: 'p-0 sm:p-0',
			}"
		>
			<template #header>
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<h1 class="text-lg font-bold">{{ $t('nav.orders') }}</h1>
					<UCheckbox v-model="hideCompleted" label="Hide Completed" @update:model-value="onHideCompletedChange" />
				</div>
			</template>

			<UTable :data="orders" :columns="order_columns" :loading="loading" @select="selectOrder">
				<template #empty>
					<div class="flex flex-col items-center justify-center py-6 gap-3">
						<span class="italic text-sm">{{ $t('pages.noOrdersFound') }}</span>
					</div>
				</template>
			</UTable>
		</UCard>
	</div>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core';
import { getOrderColumns } from '~/utils/table-columns';
import type { TableRow } from '@nuxt/ui';
import type { OrderHistory } from '~/utils/types/order-history';
import type { Range } from '~/utils/interface';

const HIDE_COMPLETED_STORAGE_KEY = 'wemotoo-dashboard-hide-completed-orders';

const props = defineProps<{
	range: Range;
}>();

const { t } = useI18n();
const order_columns = computed(() => getOrderColumns(t));

const orderStore = useOrderStore();
const { orders, loading } = storeToRefs(orderStore);

const hideCompleted = useStorage(HIDE_COMPLETED_STORAGE_KEY, false);

const fetchOrders = async () => {
	await orderStore.getOrders(props.range, { excludeCompleted: hideCompleted.value });
};

const onHideCompletedChange = async (value: boolean | 'indeterminate') => {
	hideCompleted.value = value === true;
	await fetchOrders();
};

watch(
	() => [props.range?.start?.getTime(), props.range?.end?.getTime()],
	async () => {
		await fetchOrders();
	},
);

onMounted(async () => {
	await fetchOrders();
});

const selectOrder = (e: Event, row: TableRow<OrderHistory>) => {
	const order = row.original;
	if (!order) return;

	navigateTo(`/orders/${encodeURIComponent(order.order_no)}?type=${order.type}`);
};
</script>

<style scoped></style>
