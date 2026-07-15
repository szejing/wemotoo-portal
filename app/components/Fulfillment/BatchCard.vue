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
	<UCard data-testid="fulfillment-batch-card">
		<template #header>
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-2">
					<UIcon name="i-heroicons-truck" class="size-5 shrink-0 text-main" />
					<h3 v-if="showBatchMeta" data-testid="fulfillment-batch-number" class="font-semibold text-default">
						{{ $t('components.fulfillment.batchNumber', { number: batch.batch_no }) }}
					</h3>
					<h3 v-else class="font-semibold text-default">
						{{ $t('components.fulfillment.shippingTitle') }}
					</h3>
				</div>
				<div v-if="showBatchMeta" data-testid="fulfillment-status-badges" class="flex flex-wrap gap-2">
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
			<dl class="grid grid-cols-1 gap-3 text-sm">
				<div>
					<dt class="text-muted">{{ $t('components.fulfillment.shippingMethod') }}</dt>
					<dd data-testid="fulfillment-method" class="mt-0.5 font-medium text-default">
						{{ batch.shipping_method?.description || $t('components.fulfillment.notYetProvided') }}
					</dd>
				</div>
				<div>
					<dt class="text-muted">{{ $t('components.fulfillment.shippingFee') }}</dt>
					<dd data-testid="fulfillment-fee" class="mt-0.5 font-medium text-default">
						{{ formatCurrency(batch.shipping_fee, currencyCode) }}
					</dd>
				</div>
				<div>
					<dt class="text-muted">{{ $t('components.fulfillment.shippingZone') }}</dt>
					<dd data-testid="fulfillment-zone" class="mt-0.5 font-medium text-default">
						{{ batch.shipping_zone_id || $t('components.fulfillment.notYetProvided') }}
					</dd>
				</div>
				<div>
					<dt class="text-muted">{{ $t('components.fulfillment.courierName') }}</dt>
					<dd data-testid="fulfillment-courier" class="mt-0.5 break-words font-medium text-default">
						{{ batch.courier_name?.trim() || $t('components.fulfillment.notYetProvided') }}
					</dd>
				</div>
				<div>
					<dt class="text-muted">{{ $t('components.fulfillment.trackingNumber') }}</dt>
					<dd data-testid="fulfillment-tracking" class="mt-0.5 break-all font-medium text-default">
						{{ batch.tracking_no?.trim() || $t('components.fulfillment.notYetProvided') }}
					</dd>
				</div>
			</dl>

			<div class="flex flex-wrap gap-2 border-t border-default pt-4">
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
