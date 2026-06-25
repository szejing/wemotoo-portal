<template>
	<UModal :title="$t('pages.paymentMethodDetail')" :ui="{ content: 'w-full sm:max-w-2xl' }">
		<template #body>
			<UForm ref="formRef" :state="state" class="space-y-5" @submit="onSubmit">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<UFormField :label="$t('common.code')" name="code">
						<UInput v-model="state.code" disabled />
					</UFormField>

					<UFormField :label="$t('common.type')" name="type">
						<USelect v-model="state.type" :items="paymentMethodTypeItems" value-key="value" label-key="label" class="w-full" />
					</UFormField>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<UFormField :label="$t('common.description')" name="desc" required>
						<UInput v-model="state.desc" />
					</UFormField>

					<UFormField :label="$t('common.shortDescription')" name="short_desc">
						<UInput v-model="state.short_desc" />
					</UFormField>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<UFormField :label="$t('pages.currencyCode')" name="currency_code" required>
						<UInput v-model="state.currency_code" />
					</UFormField>

					<UFormField :label="$t('pages.providerCode')" name="provider_code" required>
						<UInput v-model="state.provider_code" />
					</UFormField>
				</div>

				<UFormField :label="$t('pages.logo')" name="logo">
					<UInput v-model="state.logo" />
				</UFormField>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<UFormField :label="$t('common.status')" name="is_active">
						<USwitch v-model="state.is_active" :label="state.is_active ? $t('common.active') : $t('common.inactive')" />
					</UFormField>

					<UFormField :label="$t('pages.sandbox')" name="is_sandbox">
						<USwitch v-model="state.is_sandbox" :label="state.is_sandbox ? $t('common.active') : $t('common.inactive')" />
					</UFormField>
				</div>

				<ZInputMetadata ref="metadataInputRef" v-model="state.metadata" />
			</UForm>
		</template>

		<template #footer>
			<div class="flex justify-end gap-3 w-full">
				<UButton color="neutral" variant="soft" @click="emit('cancel')">{{ $t('common.cancel') }}</UButton>
				<UButton color="primary" variant="solid" :loading="updating" @click="submitForm">{{ $t('common.save') }}</UButton>
			</div>
		</template>
	</UModal>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from '#ui/types';
import { getPaymentMethodType, PaymentMethodType } from 'yeppi-common';
import type { PaymentMethod } from '~/utils/types/payment-method';
import type { UpdatePaymentMethodBody } from '~/repository/modules/payment-method/models/request/update-payment-method.req';
import type { BuildMetadataResult } from '~/utils/metadata-fields';

const props = defineProps<{
	paymentMethod: PaymentMethod;
}>();

const emit = defineEmits<{
	update: [value: UpdatePaymentMethodBody];
	cancel: [];
}>();

const paymentMethodStore = usePaymentMethodStore();
const { updating } = storeToRefs(paymentMethodStore);
const formRef = ref();
const metadataInputRef = ref<{ validate: () => BuildMetadataResult }>();

const state = reactive({
	code: props.paymentMethod.code,
	desc: props.paymentMethod.desc,
	short_desc: props.paymentMethod.short_desc,
	logo: props.paymentMethod.logo,
	is_active: props.paymentMethod.is_active,
	is_sandbox: props.paymentMethod.is_sandbox,
	type: props.paymentMethod.type,
	currency_code: props.paymentMethod.currency_code,
	provider_code: props.paymentMethod.provider_code,
	metadata: props.paymentMethod.metadata,
});

const paymentMethodTypeItems = Object.values(PaymentMethodType)
	.filter((value): value is PaymentMethodType => typeof value === 'number')
	.map((value) => ({
		label: getPaymentMethodType(value),
		value,
	}));

const onSubmit = async (_event: FormSubmitEvent<typeof state>) => {
	const metadataResult = metadataInputRef.value?.validate();
	if (metadataResult && !metadataResult.ok) return;

	emit('update', {
		desc: state.desc,
		short_desc: state.short_desc,
		logo: state.logo,
		is_active: state.is_active,
		is_sandbox: state.is_sandbox,
		type: state.type,
		currency_code: state.currency_code,
		provider_code: state.provider_code,
		metadata: metadataResult?.metadata,
	});
};

const submitForm = () => {
	formRef.value?.submit();
};
</script>

<style scoped></style>
