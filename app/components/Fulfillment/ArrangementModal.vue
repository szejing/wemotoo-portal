<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types';
import type { UpdateFulfillmentReq } from '~/repository/modules/fulfillment/models/request/update-fulfillment.req';
import { buildFulfillmentArrangementPayload } from '~/utils/fulfillment';
import type { Courier } from '~/utils/types/courier';
import type { FulfillmentBatch } from '~/utils/types/order-fulfillment-shipping';

type ArrangementPayload = Omit<UpdateFulfillmentReq, 'merchant_id'>;

type CourierOption = {
	id: number | null;
	name: string;
	description?: string;
};

const open = defineModel<boolean>('open', { default: false });

const props = withDefaults(defineProps<{
	batch: FulfillmentBatch;
	couriers: Courier[];
	save: (payload: ArrangementPayload) => Promise<void>;
}>(), {
	couriers: () => [],
});

const emit = defineEmits<{
	'after:leave': [];
	close: [saved?: boolean];
}>();

const saving = ref(false);
const selectedCourier = ref<CourierOption>();
const state = reactive({ tracking_no: '' });

const courierOptions = computed<CourierOption[]>(() => {
	const options = props.couriers
		.filter((courier) => courier.is_active)
		.map((courier) => ({
			id: courier.id,
			name: courier.name,
			description: courier.description ?? undefined,
		}));
	const snapshotName = props.batch.courier_name?.trim();
	if (snapshotName && !options.some((option) => option.id === props.batch.courier_id)) {
		options.unshift({ id: props.batch.courier_id ?? null, name: snapshotName });
	}
	return options;
});

const applyBatch = () => {
	selectedCourier.value = courierOptions.value.find((option) => option.id === props.batch.courier_id)
		?? courierOptions.value.find((option) => option.name === props.batch.courier_name?.trim());
	state.tracking_no = props.batch.tracking_no ?? '';
};

watch(open, (isOpen) => {
	if (isOpen) applyBatch();
});

watch(() => props.batch, () => {
	if (open.value) applyBatch();
});

onMounted(() => {
	if (open.value) applyBatch();
});

const clearCourier = () => {
	selectedCourier.value = undefined;
};

const onSubmit = async (_event: FormSubmitEvent<typeof state>) => {
	saving.value = true;
	try {
		await props.save(buildFulfillmentArrangementPayload({
			courier_id: selectedCourier.value?.id ?? null,
			courier_name: selectedCourier.value?.name ?? '',
			tracking_no: state.tracking_no,
		}));
		emit('close', true);
	} catch {
		// The store displays API errors; keep the modal open for correction.
	} finally {
		saving.value = false;
	}
};
</script>

<template>
	<UModal
		v-model:open="open"
		:title="$t('components.fulfillment.editArrangement')"
		:ui="{ content: 'w-full sm:max-w-lg' }"
		@after:leave="emit('after:leave')"
	>
		<template #body>
			<UForm :state="state" class="space-y-4" @submit="onSubmit">
				<UFormField :label="$t('components.fulfillment.courierName')">
					<div class="flex items-center gap-2">
						<USelectMenu
							v-model="selectedCourier"
							data-testid="fulfillment-courier-select"
							:items="courierOptions"
							label-key="name"
							class="min-w-0 flex-1"
						/>
						<UButton
							v-if="selectedCourier"
							type="button"
							color="neutral"
							variant="ghost"
							icon="i-heroicons-x-mark"
							:aria-label="$t('components.fulfillment.clearCourier')"
							@click="clearCourier"
						/>
					</div>
				</UFormField>

				<UFormField name="tracking_no" :label="$t('components.fulfillment.trackingNumber')">
					<UInput v-model="state.tracking_no" data-testid="fulfillment-tracking-input" class="w-full" />
				</UFormField>

				<div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
					<UButton type="button" color="neutral" variant="ghost" @click="emit('close', false)">
						{{ $t('common.cancel') }}
					</UButton>
					<UButton type="submit" color="primary" :loading="saving">
						{{ $t('common.save') }}
					</UButton>
				</div>
			</UForm>
		</template>
	</UModal>
</template>
