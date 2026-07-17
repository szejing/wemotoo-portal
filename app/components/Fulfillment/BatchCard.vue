<script setup lang="ts">
import { formatCurrency } from 'yeppi-common';
import { getFulfillmentStatusColor, getShipmentStatusColor } from '~/utils/options';
import type { FulfillmentAction } from '~/stores/Fulfillment/Fulfillment';
import type { FulfillmentBatch, FulfillmentLifecycleStatusValue, ShipmentStatusValue } from '~/utils/types/order-fulfillment-shipping';

const props = withDefaults(defineProps<{
	batch: FulfillmentBatch;
	currencyCode?: string;
	showBatchMeta?: boolean;
	loading?: boolean;
}>(), {
	currencyCode: 'MYR',
	showBatchMeta: false,
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

const { t } = useI18n();

const courierLabel = computed(() => props.batch.courier_name?.trim() || t('components.fulfillment.notYetProvided'));
const trackingLabel = computed(() => props.batch.tracking_no?.trim() || t('components.fulfillment.notYetProvided'));
const methodLabel = computed(() => props.batch.shipping_method?.description || '');
const zoneLabel = computed(() => props.batch.shipping_zone_id?.trim() || '');

const nextActions = computed(() => {
	const actions: { action: FulfillmentAction; label: string; color: 'primary' | 'success' }[] = [];
	if (props.batch.status === 'pending') {
		actions.push({ action: 'processing', label: 'components.fulfillment.startProcessing', color: 'primary' });
	} else if (props.batch.status === 'processing') {
		actions.push({ action: 'packed', label: 'components.fulfillment.markAsPacked', color: 'primary' });
	} else if (props.batch.status === 'packed') {
		actions.push({ action: 'fulfilled', label: 'components.fulfillment.markAsFulfilled', color: 'primary' });
	}

	if (['shipped', 'in_transit'].includes(props.batch.shipment_status)) {
		actions.push({ action: 'delivered', label: 'components.fulfillment.markAsDelivered', color: 'success' });
	}
	return actions;
});
</script>

<template>
	<UCard data-testid="fulfillment-batch-card" class="shipping-info-card">
		<template #header>
			<div class="card-header-sidebar">
				<div class="sidebar-title">
					<UIcon name="i-heroicons-truck" class="w-5 h-5 shrink-0" />
					<h3 v-if="showBatchMeta" data-testid="fulfillment-batch-number">
						{{ $t('components.fulfillment.batchNumber', { number: batch.batch_no }) }}
					</h3>
					<h3 v-else>
						{{ $t('components.fulfillment.shippingTitle') }}
					</h3>
				</div>
				<div data-testid="fulfillment-status-badges" class="status-badges">
					<UBadge :color="getFulfillmentStatusColor(batch.status)" variant="subtle" size="sm">
						{{ $t(lifecycleLabels[batch.status]) }}
					</UBadge>
					<UBadge :color="getShipmentStatusColor(batch.shipment_status)" variant="subtle" size="sm">
						{{ $t(shipmentLabels[batch.shipment_status]) }}
					</UBadge>
				</div>
			</div>
		</template>

		<div class="shipping-body">
			<div class="shipping-item">
				<div class="shipping-main">
					<div class="shipping-left">
						<span data-testid="fulfillment-courier" class="shipping-courier">{{ courierLabel }}</span>
						<div data-testid="fulfillment-tracking" class="shipping-tracking">
							<span class="shipping-tracking-label">{{ $t('components.fulfillment.trackingNumber') }}:</span>
							<span class="shipping-tracking-value">{{ trackingLabel }}</span>
						</div>
						<div v-if="methodLabel" data-testid="fulfillment-method" class="shipping-meta">
							{{ methodLabel }}
						</div>
						<div v-else data-testid="fulfillment-method" class="shipping-meta">
							{{ $t('components.fulfillment.notYetProvided') }}
						</div>
						<div v-if="zoneLabel" data-testid="fulfillment-zone" class="shipping-meta">
							{{ zoneLabel }}
						</div>
					</div>
					<span data-testid="fulfillment-fee" class="shipping-fee">
						{{ formatCurrency(batch.shipping_fee, currencyCode) }}
					</span>
				</div>
			</div>

			<div class="shipping-actions">
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

				<UPopover v-if="nextActions.length" :content="{ align: 'start' }">
					<UButton
						data-testid="fulfillment-update-status"
						size="sm"
						color="neutral"
						variant="soft"
						icon="i-heroicons-arrow-path"
						:disabled="loading"
					>
						{{ $t('components.fulfillment.updateStatus') }}
					</UButton>
					<template #content>
						<div class="w-64 space-y-2 p-3">
							<p class="text-sm font-medium text-default">
								{{ $t('components.fulfillment.chooseNextStatus') }}
							</p>
							<UButton
								v-for="item in nextActions"
								:key="item.action"
								:data-testid="`fulfillment-next-${item.action}`"
								block
								:color="item.color"
								variant="soft"
								:loading="loading"
								@click="emit('action', item.action, batch)"
							>
								{{ $t(item.label) }}
							</UButton>
						</div>
					</template>
				</UPopover>
			</div>
		</div>
	</UCard>
</template>

<style scoped>
.shipping-info-card {
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header-sidebar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
}

.sidebar-title {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1rem;
	font-weight: 600;
	color: var(--color-gray-800);
	min-width: 0;
}

.sidebar-title h3 {
	margin: 0;
	font-size: inherit;
	font-weight: inherit;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.status-badges {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 0.375rem;
	flex-shrink: 0;
}

.shipping-body {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.shipping-item {
	padding: 1rem;
	background: var(--color-gray-50);
	border-radius: 0.5rem;
	border: 1px solid var(--color-gray-200);
}

.shipping-main {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 0.75rem;
}

.shipping-left {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	min-width: 0;
	flex: 1;
}

.shipping-courier {
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--color-gray-800);
	word-break: break-word;
}

.shipping-tracking {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem;
	font-size: 0.75rem;
}

.shipping-tracking-label {
	color: var(--color-gray-500);
}

.shipping-tracking-value {
	color: var(--color-gray-700);
	font-weight: 500;
	word-break: break-all;
}

.shipping-meta {
	font-size: 0.75rem;
	color: var(--color-gray-500);
	word-break: break-word;
}

.shipping-fee {
	font-size: 1rem;
	font-weight: 700;
	color: var(--color-primary-600);
	white-space: nowrap;
	flex-shrink: 0;
}

.shipping-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

@media (max-width: 380px) {
	.shipping-main {
		flex-direction: column;
		align-items: stretch;
	}

	.shipping-fee {
		align-self: flex-end;
	}
}
</style>
