<script setup lang="ts">
import { LazyFulfillmentArrangementModal } from '#components';
import { useCourierStore } from '~/stores/Courier/Courier';
import { useFulfillmentStore, type FulfillmentAction } from '~/stores/Fulfillment/Fulfillment';
import { useShippingMethodStore } from '~/stores/ShippingMethod/ShippingMethod';
import type { Courier } from '~/utils/types/courier';
import type { FulfillmentBatch, ShippingMethodOption } from '~/utils/types/order-fulfillment-shipping';
import type { OrderHistory } from '~/utils/types/order-history';

const props = withDefaults(defineProps<{
	order: OrderHistory;
	ownerType?: 'order' | 'sale';
}>(), {
	ownerType: 'order',
});

const emit = defineEmits<{
	refresh: [];
}>();

const overlay = useOverlay();
const fulfillmentStore = useFulfillmentStore();
const shippingMethodStore = useShippingMethodStore();
const courierStore = useCourierStore();
const arrangementShippingMethods = ref<ShippingMethodOption[]>([]);
const arrangementCouriers = ref<Courier[]>([]);

const batches = computed(() => [...(props.order.fulfillments ?? [])].sort((left, right) => left.batch_no - right.batch_no));
const loading = computed(() => fulfillmentStore.creating || fulfillmentStore.updating);
const currencyCode = computed(() => props.order.currency?.code ?? 'MYR');
const canCreateMissingBatch = computed(() => props.ownerType === 'order' && batches.value.length === 0);

const loadArrangementSources = async () => {
	const address = props.order.customer?.shipping_address;
	const [shippingMethods, couriers] = await Promise.all([
		shippingMethodStore.resolveFulfillmentMethods({
			country_code: address?.country_code?.trim() || 'MY',
			state: address?.state?.trim() || undefined,
			postal_code: address?.postal_code?.trim() || undefined,
		}),
		courierStore.fetchAllActiveCouriers(),
	]);
	arrangementShippingMethods.value = shippingMethods;
	arrangementCouriers.value = couriers;
};

const editBatch = async (batch: FulfillmentBatch) => {
	await loadArrangementSources();

	const arrangementModal = overlay.create(LazyFulfillmentArrangementModal, {
		props: {
			open: true,
			batch,
			shippingMethods: arrangementShippingMethods.value,
			couriers: arrangementCouriers.value,
			save: async (payload) => {
				await fulfillmentStore.updateArrangement(batch.id, payload);
			},
		},
	});

	const saved = await arrangementModal.open().result;
	if (saved) emit('refresh');
};

const runAction = async (action: FulfillmentAction, batch: FulfillmentBatch) => {
	await fulfillmentStore.runAction(batch.id, action);
	emit('refresh');
};

const createMissingBatch = async () => {
	if (!canCreateMissingBatch.value) return;
	await fulfillmentStore.createFulfillment(props.order.order_no);
	emit('refresh');
};
</script>

<template>
	<section class="space-y-4" aria-labelledby="fulfillment-batches-heading">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 id="fulfillment-batches-heading" class="text-lg font-semibold text-default">
					{{ $t('components.fulfillment.batchesTitle') }}
				</h2>
				<p class="text-sm text-muted">{{ $t('components.fulfillment.batchesDescription') }}</p>
			</div>
			<UBadge color="neutral" variant="subtle">
				{{ $t('components.fulfillment.batchCount', { count: batches.length }) }}
			</UBadge>
		</div>

		<div v-if="batches.length" class="space-y-4">
			<FulfillmentBatchCard
				v-for="batch in batches"
				:key="batch.id"
				:batch="batch"
				:currency-code="currencyCode"
				:loading="loading"
				@edit="editBatch"
				@action="runAction"
			/>
		</div>

		<UCard v-else>
			<div class="flex flex-col items-center gap-4 px-4 py-8 text-center">
				<div class="flex size-14 items-center justify-center rounded-full bg-elevated">
					<UIcon name="i-heroicons-cube-transparent" class="size-8 text-muted" />
				</div>
				<div class="space-y-1">
					<p class="font-medium text-default">{{ $t('components.fulfillment.noBatches') }}</p>
					<p class="max-w-md text-sm text-muted">{{ $t('components.fulfillment.noBatchesHint') }}</p>
				</div>
				<UButton
					v-if="canCreateMissingBatch"
					data-testid="fulfillment-create-missing"
					color="primary"
					icon="i-heroicons-plus"
					:loading="loading"
					@click="createMissingBatch"
				>
					{{ $t('components.fulfillment.createMissingBatch') }}
				</UButton>
			</div>
		</UCard>

		<p class="text-xs text-muted">{{ $t('components.fulfillment.noSplitDeleteHint') }}</p>
	</section>
</template>
