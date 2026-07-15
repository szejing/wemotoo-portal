<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types';
import type { UpdateFulfillmentReq } from '~/repository/modules/fulfillment/models/request/update-fulfillment.req';
import { createFulfillmentArrangementValidation } from '~/utils/schema/Fulfillment/ArrangementValidation';
import { buildFulfillmentArrangementPayload } from '~/utils/fulfillment';
import type { Courier } from '~/utils/types/courier';
import type { FulfillmentBatch, ShippingMethodOption } from '~/utils/types/order-fulfillment-shipping';

type ArrangementPayload = Omit<UpdateFulfillmentReq, 'merchant_id'>;

const open = defineModel<boolean>('open', { default: false });

const props = withDefaults(defineProps<{
	batch: FulfillmentBatch;
	shippingMethods: ShippingMethodOption[];
	couriers: Courier[];
	save: (payload: ArrangementPayload) => Promise<void>;
}>(), {
	shippingMethods: () => [],
	couriers: () => [],
});

const emit = defineEmits<{
	'after:leave': [];
	close: [saved?: boolean];
}>();

const { t } = useI18n();
const saving = ref(false);

const original = computed(() => ({
	shipping_method_id: props.batch.shipping_method?.id ?? null,
	shipping_fee: Number(props.batch.shipping_fee),
	courier_id: props.batch.courier_id,
	courier_name: props.batch.courier_name ?? '',
}));

const state = reactive({
	shipping_method_id: null as number | null,
	shipping_fee: 0,
	courier_id: null as number | null,
	courier_name: '',
	tracking_no: '',
	reason: '',
});

const selectedShippingMethodId = computed<number | undefined>({
	get: () => state.shipping_method_id ?? undefined,
	set: (value) => {
		state.shipping_method_id = value ?? null;
	},
});

const selectedCourierId = computed<number | undefined>({
	get: () => state.courier_id ?? undefined,
	set: (value) => {
		state.courier_id = value ?? null;
	},
});

const applyBatch = () => {
	state.shipping_method_id = original.value.shipping_method_id;
	state.shipping_fee = original.value.shipping_fee;
	state.courier_id = original.value.courier_id;
	state.courier_name = original.value.courier_name;
	state.tracking_no = props.batch.tracking_no ?? '';
	state.reason = '';
};

const schema = computed(() => createFulfillmentArrangementValidation(t, original.value));
const arrangementChanged = computed(() =>
	state.shipping_method_id !== original.value.shipping_method_id || Number(state.shipping_fee) !== original.value.shipping_fee,
);

const methodOptions = computed(() => {
	const options = props.shippingMethods
		.filter((method) => method.is_active)
		.map((method) => ({ value: Number(method.id), label: method.description }));
	const current = props.batch.shipping_method;
	if (current && !options.some((option) => option.value === Number(current.id))) {
		options.unshift({ value: Number(current.id), label: current.description });
	}
	return options;
});

const courierOptions = computed(() => props.couriers.map((courier) => ({
	value: courier.id,
	label: courier.name,
	description: courier.description ?? undefined,
})));

watch(() => state.courier_id, (courierId) => {
	if (courierId == null) return;
	const selected = props.couriers.find((courier) => courier.id === courierId);
	if (selected) state.courier_name = selected.name;
});

watch(() => state.courier_name, (courierName) => {
	const selected = props.couriers.find((courier) => courier.id === state.courier_id);
	const snapshotName = state.courier_id === original.value.courier_id ? original.value.courier_name : undefined;
	const expectedName = selected?.name ?? snapshotName;
	if (expectedName !== undefined && expectedName.trim().toLowerCase() !== courierName.trim().toLowerCase()) {
		state.courier_id = null;
	}
});

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
	state.courier_id = null;
	state.courier_name = '';
};

const onSubmit = async (event: FormSubmitEvent<typeof state>) => {
	saving.value = true;
	try {
		await props.save(buildFulfillmentArrangementPayload(event.data));
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
		:description="$t('components.fulfillment.editArrangementDescription', { number: batch.batch_no })"
		:ui="{ content: 'w-full sm:max-w-xl' }"
		@after:leave="emit('after:leave')"
	>
		<template #body>
			<UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
				<UFormField name="shipping_method_id" :label="$t('components.fulfillment.shippingMethod')">
					<USelectMenu
						v-model="selectedShippingMethodId"
						:items="methodOptions"
						value-key="value"
						class="w-full"
					/>
				</UFormField>

				<UFormField name="shipping_fee" :label="$t('components.fulfillment.shippingFee')" required>
					<UInput v-model.number="state.shipping_fee" type="number" min="0" step="0.01" />
				</UFormField>

				<UFormField name="courier_id" :label="$t('components.fulfillment.registeredCourier')">
					<div class="flex items-center gap-2">
						<USelectMenu
							v-model="selectedCourierId"
							:items="courierOptions"
							value-key="value"
							class="min-w-0 flex-1"
						/>
						<UButton
							v-if="state.courier_id != null"
							type="button"
							color="neutral"
							variant="ghost"
							icon="i-heroicons-x-mark"
							:aria-label="$t('components.fulfillment.clearCourier')"
							@click="clearCourier"
						/>
					</div>
				</UFormField>

				<UFormField name="courier_name" :label="$t('components.fulfillment.courierName')">
					<UInput v-model="state.courier_name" />
				</UFormField>

				<UFormField name="tracking_no" :label="$t('components.fulfillment.trackingNumber')">
					<UInput v-model="state.tracking_no" />
				</UFormField>

				<UFormField
					name="reason"
					:label="$t('components.fulfillment.reason')"
					:required="arrangementChanged"
					:hint="arrangementChanged ? $t('components.fulfillment.reasonRequiredHint') : $t('components.fulfillment.reasonOptionalHint')"
				>
					<UTextarea v-model="state.reason" :rows="3" />
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
