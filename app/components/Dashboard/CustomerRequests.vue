<template>
	<div v-if="requests.length > 0" class="mt-4 rounded-lg">
		<UCard
			class="border border-warning/70"
			:ui="{
				header: 'bg-warning/10 px-4 py-3 sm:px-6 border-b border-warning/30',
				body: 'p-0 sm:p-0',
			}"
		>
			<template #header>
				<div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex items-center gap-2">
						<UIcon name="i-heroicons-exclamation-triangle" class="size-5 text-warning" />
						<h1 class="text-lg font-bold">{{ $t('pages.customerRequests') }}</h1>
					</div>
					<UBadge v-if="requests.length > 0" color="warning" variant="subtle">
						{{ requests.length }}
					</UBadge>
				</div>
			</template>

			<div v-if="loading" class="flex items-center gap-3 px-4 py-5 text-sm text-muted sm:px-6">
				<UIcon name="i-heroicons-arrow-path" class="size-4 animate-spin" />
				<span>{{ $t('common.loading') }}</span>
			</div>

			<div v-else class="divide-y divide-default">
				<div
					v-for="{ order, request } in requests"
					:key="request.id"
					role="button"
					tabindex="0"
					class="grid w-full cursor-pointer grid-cols-1 gap-3 px-4 py-4 text-left transition hover:bg-warning/5 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto] sm:items-center sm:px-6"
					@click="openRequest(order, request)"
					@keydown.enter="openRequest(order, request)"
					@keydown.space.prevent="openRequest(order, request)"
				>
					<div class="min-w-0">
						<div class="flex flex-wrap items-center gap-2">
							<UBadge color="warning" variant="subtle">
								{{ requestTypeLabel(request.request_type) }}
							</UBadge>
							<span class="truncate text-sm font-semibold text-highlighted">{{ request.ref_no || order.order_no }}</span>
						</div>
						<p class="mt-1 truncate text-sm text-muted">
							{{ customerLabel(order) }}
						</p>
					</div>

					<div class="min-w-0">
						<p class="truncate text-sm font-medium text-default">
							{{ request.reason_code }}
						</p>
						<p v-if="request.reason_description" class="mt-1 line-clamp-2 text-sm text-muted">
							{{ request.reason_description }}
						</p>
					</div>

					<div class="flex items-center justify-between gap-3 sm:justify-end">
						<div class="text-left sm:text-right">
							<p class="text-xs text-muted">{{ $t('pages.requestedAt') }}</p>
							<p class="text-sm font-medium text-default">{{ formatRequestedAt(request.requested_at) }}</p>
						</div>
						<UButton
							color="warning"
							variant="soft"
							size="sm"
							icon="i-heroicons-arrow-right"
							:aria-label="$t('pages.viewCustomerRequest')"
							@click.stop="openRequest(order, request)"
						/>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup lang="ts">
import { getFormattedDate, OrderRequestType } from 'yeppi-common';
import type { CustomerRequest, OrderHistory } from '~/utils/types/order-history';

type CustomerRequestItem = {
	order: OrderHistory;
	request: CustomerRequest;
};

const orderStore = useOrderStore();
const { urgent_customer_requests, urgent_customer_requests_loading } = storeToRefs(orderStore);
const { t } = useI18n();

const loading = computed(() => urgent_customer_requests_loading.value);

const getCustomerRequest = (order: OrderHistory): CustomerRequest | undefined => {
	return order.customer_requests?.find((request) => request.status === 'pending');
};

const requests = computed<CustomerRequestItem[]>(() =>
	urgent_customer_requests.value
		.map((order) => {
			const request = getCustomerRequest(order);
			return request && request.status === 'pending' ? { order, request } : undefined;
		})
		.filter((item): item is CustomerRequestItem => item != null),
);

const requestTypeLabel = (type: OrderRequestType) => {
	const labels: Record<OrderRequestType, string> = {
		[OrderRequestType.CANCELLATION]: t('options.requestType.cancellation'),
		[OrderRequestType.RETURN_REFUND]: t('options.requestType.returnRefund'),
		[OrderRequestType.RETURN_EXCHANGE]: t('options.requestType.returnExchange'),
	};

	return labels[type] ?? type;
};

const customerLabel = (order: OrderHistory) => {
	const customerNo = order.customer?.customer_no ?? order.customer_no;
	const customerName = order.customer?.name;

	return customerName ? `${customerNo} | ${customerName}` : customerNo;
};

const formatRequestedAt = (value: string | Date) => {
	return getFormattedDate(new Date(value), 'dd MMM yyyy, hh:mm aa');
};

const openRequest = (order: OrderHistory, request: CustomerRequest) => {
	const orderNo = request.ref_no || order.order_no;
	const type = request.ref_type || order.type;

	navigateTo(`/orders/${encodeURIComponent(orderNo)}?type=${type}`);
};
</script>
