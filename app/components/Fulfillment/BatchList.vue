<script setup lang="ts">
import { LazyFulfillmentArrangementModal } from '#components';
import { useCourierStore } from '~/stores/Courier/Courier';
import { useFulfillmentStore, type FulfillmentAction } from '~/stores/Fulfillment/Fulfillment';
import type { Courier } from '~/utils/types/courier';
import type { FulfillmentBatch } from '~/utils/types/order-fulfillment-shipping';
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
const courierStore = useCourierStore();
const arrangementCouriers = ref<Courier[]>([]);

const batches = computed(() => [...(props.order.fulfillments ?? [])].sort((left, right) => left.batch_no - right.batch_no));
const loading = computed(() => fulfillmentStore.updating);
const currencyCode = computed(() => props.order.currency?.code ?? 'MYR');

const editBatch = async (batch: FulfillmentBatch) => {
	arrangementCouriers.value = await courierStore.fetchAllActiveCouriers();

	const arrangementModal = overlay.create(LazyFulfillmentArrangementModal, {
		props: {
			open: true,
			batch,
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
</script>

<template>
	<section v-if="batches.length" class="space-y-3" aria-labelledby="fulfillment-shipping-heading">
		<div v-if="batches.length > 1" class="flex items-center justify-between gap-3">
			<h2 id="fulfillment-shipping-heading" class="text-base font-semibold text-default">
				{{ $t('components.fulfillment.batchesTitle') }}
			</h2>
			<UBadge data-testid="fulfillment-batch-count" color="neutral" variant="subtle">
				{{ $t('components.fulfillment.batchCount', { count: batches.length }) }}
			</UBadge>
		</div>

		<FulfillmentBatchCard
			v-for="batch in batches"
			:key="batch.id"
			:batch="batch"
			:currency-code="currencyCode"
			:show-batch-meta="batches.length > 1"
			:loading="loading"
			@edit="editBatch"
			@action="runAction"
		/>
	</section>
</template>
