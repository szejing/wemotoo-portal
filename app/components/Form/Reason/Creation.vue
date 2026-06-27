<template>
	<div class="w-full">
		<UForm ref="formRef" :schema="schema" :state="new_reason" class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6" @submit="submitForm">
			<div class="lg:col-span-9 space-y-6">
				<UCard>
					<div class="space-y-4">
						<UFormField :label="$t('common.code')" name="code" required>
							<UInput v-model="new_reason.code" class="uppercase" />
						</UFormField>
						<UFormField :label="$t('common.description')" name="description" required>
							<UInput v-model="new_reason.description" />
						</UFormField>
						<UFormField :label="$t('table.reasonType')" name="type" required>
							<USelect v-model="new_reason.type" :items="typeOptions" value-attribute="value" class="w-full" />
						</UFormField>
						<UFormField :label="$t('common.status')" name="is_active">
							<USwitch v-model="new_reason.is_active" />
						</UFormField>
					</div>
				</UCard>
			</div>

			<div class="lg:col-span-3">
				<div class="lg:sticky lg:top-4">
					<FormReasonReviewSummary :summary="reviewSummary" subtitle-key="components.reasonForm.reviewSubtitleCreate" />
				</div>
			</div>
		</UForm>
	</div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types';
import type { z } from 'zod';
import { ReasonType } from 'yeppi-common';
import { CreateReasonValidation } from '~/utils/schema';
import { reasonTypeOptions } from '~/utils/options/reason-type';
import type { Reason } from '~/utils/types/reason';

const emit = defineEmits<{
	saved: [reason: Reason | undefined];
}>();

const { t } = useI18n();
const reasonStore = useReasonStore();
const { new_reason } = storeToRefs(reasonStore);

const schema = computed(() => CreateReasonValidation(t));
type Schema = z.output<ReturnType<typeof CreateReasonValidation>>;

const typeOptions = computed(() => reasonTypeOptions(t));

const typeLabel = (type: ReasonType | undefined) => {
	if (type === ReasonType.RETURN_EXCHANGE) {
		return t('options.reasonType.returnExchange');
	}
	if (type === ReasonType.CANCEL_ORDER) {
		return t('options.reasonType.cancelOrder');
	}
	return t('common.notSet');
};

const reviewSummary = computed(() => ({
	code: new_reason.value.code.trim().toUpperCase(),
	description: new_reason.value.description.trim(),
	typeLabel: typeLabel(new_reason.value.type),
	statusLabel: t(new_reason.value.is_active ? 'common.active' : 'common.inactive'),
}));

onMounted(() => {
	reasonStore.resetNewReason();
});

const formRef = ref<{ submit: () => void } | null>(null);

const submitForm = async (event: FormSubmitEvent<Schema>) => {
	const data = event.data;
	const reason = await reasonStore.createReason({
		code: data.code.trim().toUpperCase(),
		description: data.description.trim(),
		type: data.type,
		is_active: data.is_active,
	});

	if (reason) {
		emit('saved', reason);
	}
};

const submit = () => {
	formRef.value?.submit();
};

defineExpose({ submit });
</script>
