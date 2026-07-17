<template>
	<UModal
		:title="$t('components.zModal.updatePaymentInfo')"
		:ui="{
			content: 'w-full sm:max-w-[60%] md:max-w-[40%] lg:max-w-[30%]',
		}"
	>
		<template #body>
			<UForm :schema="paymentSchema" :state="state.payment" class="space-y-4" @submit="onSubmit">
				<!-- *********************** General Info *********************** -->
				<ZInputOrderDetailPayment
					v-model:payment-date-time="state.payment.payment_date_time"
					v-model:payment-type-code="state.payment.payment_type_code"
					v-model:ref-no1="state.payment.ref_no1"
					v-model:ref-no2="state.payment.ref_no2"
					v-model:payment-amount="state.payment.payment_amt"
					v-model:currency-code="state.payment.currency_code"
					v-model:external-intg-type="state.payment.external_intg_type"
				/>
				<!-- *********************** General Info *********************** -->

				<div class="flex-jend gap-4">
					<UButton color="neutral" variant="ghost" @click="onCancel">{{ $t('common.cancel') }}</UButton>
					<UButton color="primary" variant="solid" :loading="is_loading" :disabled="is_loading" type="submit">{{ $t('components.zModal.update') }}</UButton>
				</div>
			</UForm>
		</template>
	</UModal>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from '#ui/types';
import type { z } from 'zod';
import type { PaymentModel } from '~/utils/models/index';
import { getDefaultOrderPaymentAmt } from '~/utils/order-payment-amt';
import type { OrderHistory } from '~/utils/types/order-history';
import { UpdateOrderPaymentValidation } from '~/utils/schema';

const { t } = useI18n();
const paymentSchema = computed(() => UpdateOrderPaymentValidation(t));

type Schema = z.infer<ReturnType<typeof UpdateOrderPaymentValidation>>;

const orderStore = useOrderStore();
const is_loading = ref(false);

const props = defineProps({
	order: {
		type: Object as PropType<OrderHistory>,
		required: true,
	},
	payment: {
		type: Object as PropType<PaymentModel> | undefined,
		required: false,
	},
});

const emit = defineEmits(['update', 'cancel']);
const state = reactive({
	payment: props.payment || {
		payment_date_time: new Date(),
		payment_type_code: undefined,
		ref_no1: undefined,
		ref_no2: undefined,
		payment_amt: getDefaultOrderPaymentAmt(props.order),
		currency_code: props.order.currency?.code,
		external_intg_type: undefined,
		metadata: undefined,
	},
});

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
	try {
		is_loading.value = true;

		await orderStore.updatePayments(
			props.order.order_no,
			props.order.customer.customer_no,
			JSON.parse(JSON.stringify(event.data)) as PaymentModel,
			props.order.payments as PaymentModel[],
		);
		emit('update', true);
	} catch {
		emit('update', false);
	} finally {
		is_loading.value = false;
	}
};

const onCancel = () => {
	emit('cancel');
};
</script>

<style scoped></style>
