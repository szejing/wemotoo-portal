<script setup lang="ts">
import { formatCurrency } from 'yeppi-common';
import { getFulfillmentStatusColor, getShipmentStatusColor } from '~/utils/options';
import type { FulfillmentAction } from '~/stores/Fulfillment/Fulfillment';
import type { FulfillmentBatch, FulfillmentLifecycleStatusValue, ShipmentStatusValue } from '~/utils/types/order-fulfillment-shipping';

const props = withDefaults(defineProps<{
	batch: FulfillmentBatch;
	currencyCode?: string;
	loading?: boolean;
}>(), {
	currencyCode: 'MYR',
	loading: false,
});

const emit = defineEmits<{
	edit: [batch: FulfillmentBatch];
	action: [action: FulfillmentAction, batch: FulfillmentBatch];
}>();

const lifecycleLabels: Record<FulfillmentLifecycleStatusValue, string> = {
	pending: 'options.pending',
	processing: 'options.processing',
	packed: 'options.packed',
	fulfilled: 'options.fulfilled',
};

const shipmentLabels: Record<ShipmentStatusValue, string> = {
	pending: 'options.pending',
	shipped: 'options.shipped',
	in_transit: 'options.inTransit',
	delivered: 'options.delivered',
	failed: 'options.failed',
};

const lifecycleAction = computed<FulfillmentAction | undefined>(() => {
	if (props.batch.status === 'pending') return 'processing';
	if (props.batch.status === 'processing') return 'packed';
	if (props.batch.status === 'packed') return 'fulfilled';
	return undefined;
});

const canMarkShipped = computed(() => props.batch.shipment_status === 'pending');
const canMarkDelivered = computed(() => ['shipped', 'in_transit'].includes(props.batch.shipment_status));
const hasTrackingNumber = computed(() => Boolean(props.batch.tracking_no?.trim()));

const lifecycleActionLabel = computed(() => {
	if (lifecycleAction.value === 'processing') return 'components.fulfillment.startProcessing';
	if (lifecycleAction.value === 'packed') return 'components.fulfillment.markAsPacked';
	return 'components.fulfillment.markAsFulfilled';
});

const formatDateTime = (value: string | Date | null): string => {
	if (!value) return '';
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
};

const timestamps = computed(() => [
	{ key: 'created-at', label: 'components.fulfillment.createdAt', value: formatDateTime(props.batch.created_at) },
	{ key: 'packed-at', label: 'components.fulfillment.packedAt', value: formatDateTime(props.batch.packed_at) },
	{ key: 'shipped-at', label: 'components.fulfillment.shippedAt', value: formatDateTime(props.batch.shipped_at) },
	{ key: 'delivered-at', label: 'components.fulfillment.deliveredAt', value: formatDateTime(props.batch.delivered_at) },
	{ key: 'updated-at', label: 'components.fulfillment.updatedAt', value: formatDateTime(props.batch.updated_at) },
].filter((timestamp) => timestamp.value));
</script>

<template>
	<UCard data-testid="fulfillment-batch-card">
		<template #header>
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-2">
					<UIcon name="i-heroicons-cube" class="size-5 shrink-0 text-main" />
					<h3 data-testid="fulfillment-batch-number" class="font-semibold text-default">
						{{ $t('components.fulfillment.batchNumber', { number: batch.batch_no }) }}
					</h3>
				</div>
				<div class="flex flex-wrap gap-2">
					<UBadge :color="getFulfillmentStatusColor(batch.status)" variant="subtle">
						{{ $t(lifecycleLabels[batch.status]) }}
					</UBadge>
					<UBadge :color="getShipmentStatusColor(batch.shipment_status)" variant="subtle">
						{{ $t(shipmentLabels[batch.shipment_status]) }}
					</UBadge>
				</div>
			</div>
		</template>

		<div class="space-y-4">
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="rounded-lg bg-elevated/60 p-3">
					<p class="text-xs font-medium text-muted">{{ $t('components.fulfillment.shippingMethod') }}</p>
					<p data-testid="fulfillment-method" class="mt-1 font-medium text-default">
						{{ batch.shipping_method?.description || $t('components.fulfillment.notYetProvided') }}
					</p>
				</div>
				<div class="rounded-lg bg-elevated/60 p-3">
					<p class="text-xs font-medium text-muted">{{ $t('components.fulfillment.shippingFee') }}</p>
					<p data-testid="fulfillment-fee" class="mt-1 font-semibold text-default">
						{{ formatCurrency(batch.shipping_fee, currencyCode) }}
					</p>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="flex min-w-0 items-center gap-2 rounded-lg border border-default px-3 py-2.5">
					<UIcon name="i-heroicons-building-office-2" class="size-4 shrink-0 text-muted" aria-hidden="true" />
					<span data-testid="fulfillment-courier" class="truncate text-sm font-medium text-default">
						{{ batch.courier_name?.trim() || $t('components.fulfillment.notYetProvided') }}
					</span>
				</div>
				<div class="flex min-w-0 items-center gap-2 rounded-lg border border-default px-3 py-2.5">
					<UIcon name="i-heroicons-qr-code" class="size-4 shrink-0 text-muted" aria-hidden="true" />
					<span data-testid="fulfillment-tracking" class="break-all text-sm font-medium text-default">
						{{ batch.tracking_no?.trim() || $t('components.fulfillment.notYetProvided') }}
					</span>
				</div>
			</div>

			<dl v-if="timestamps.length" class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
				<div v-for="timestamp in timestamps" :key="timestamp.key" :data-testid="`fulfillment-${timestamp.key}`" class="flex items-baseline justify-between gap-3">
					<dt class="text-muted">{{ $t(timestamp.label) }}</dt>
					<dd class="text-right text-default">{{ timestamp.value }}</dd>
				</div>
			</dl>

			<div class="flex flex-col gap-2 border-t border-default pt-4 sm:flex-row sm:flex-wrap">
				<UButton
					v-if="lifecycleAction"
					:data-testid="`fulfillment-action-${lifecycleAction}`"
					size="sm"
					color="primary"
					:loading="loading"
					:disabled="loading"
					@click="emit('action', lifecycleAction, batch)"
				>
					{{ $t(lifecycleActionLabel) }}
				</UButton>
				<UButton
					v-if="canMarkShipped"
					data-testid="fulfillment-action-shipped"
					size="sm"
					color="primary"
					variant="soft"
					:loading="loading"
					:disabled="loading || !hasTrackingNumber"
					@click="emit('action', 'shipped', batch)"
				>
					{{ $t('components.fulfillment.markAsShipped') }}
				</UButton>
				<UButton
					v-if="canMarkDelivered"
					data-testid="fulfillment-action-delivered"
					size="sm"
					color="success"
					:loading="loading"
					:disabled="loading"
					@click="emit('action', 'delivered', batch)"
				>
					{{ $t('components.fulfillment.markAsDelivered') }}
				</UButton>
				<UButton
					data-testid="fulfillment-edit"
					size="sm"
					color="neutral"
					variant="soft"
					icon="i-heroicons-pencil-square"
					:disabled="loading"
					@click="emit('edit', batch)"
				>
					{{ $t('common.edit') }}
				</UButton>
			</div>
			<p v-if="canMarkShipped && !hasTrackingNumber" class="text-xs text-muted">
				{{ $t('components.fulfillment.trackingRequiredForShipped') }}
			</p>
		</div>
	</UCard>
</template>
