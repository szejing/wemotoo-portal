<template>
	<div class="w-full">
		<UForm ref="formRef" :schema="schema" :state="formState" class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6" @submit="submitForm">
			<div class="lg:col-span-9 space-y-6">
				<UCard>
					<div class="space-y-4">
						<UFormField :label="$t('common.code')" name="code">
							<UInput :model-value="reasonCode" disabled />
						</UFormField>
						<UFormField :label="$t('common.description')" name="description" required>
							<UInput v-model="formState.description" />
						</UFormField>
						<UFormField :label="$t('table.reasonType')" name="type" required>
							<USelect v-model="formState.type" :items="typeOptions" value-attribute="value" class="w-full" />
						</UFormField>
						<UFormField :label="$t('common.status')" name="is_active">
							<USwitch v-model="formState.is_active" />
						</UFormField>
					</div>
				</UCard>
			</div>

			<div class="lg:col-span-3">
				<div class="lg:sticky lg:top-4">
					<FormReasonReviewSummary :summary="reviewSummary" subtitle-key="components.reasonForm.reviewSubtitleEdit" />
				</div>
			</div>
		</UForm>
	</div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types';
import type { z } from 'zod';
import { ReasonType } from 'yeppi-common';
import { UpdateReasonValidation } from '~/utils/schema';
import { reasonTypeOptions } from '~/utils/options/reason-type';
import type { Reason } from '~/utils/types/reason';
import type { ReasonFormFields } from '~/utils/types/form/reason-form';

const props = defineProps<{
	reasonCode: string;
	initialReason: Reason;
}>();

const { t } = useI18n();
const reasonStore = useReasonStore();

const schema = computed(() => UpdateReasonValidation(t));
type Schema = z.output<ReturnType<typeof UpdateReasonValidation>>;

const typeOptions = computed(() => reasonTypeOptions(t));

const formState = reactive<ReasonFormFields>({
	code: '',
	description: '',
	type: undefined,
	is_active: true,
});

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
	code: props.reasonCode,
	description: formState.description.trim(),
	typeLabel: typeLabel(formState.type),
	statusLabel: t(formState.is_active ? 'common.active' : 'common.inactive'),
}));

const applyFromReason = (reason: Reason) => {
	formState.code = reason.code;
	formState.description = reason.description;
	formState.type = reason.type;
	formState.is_active = reason.is_active;
};

watch(
	() => props.initialReason,
	(reason) => {
		if (reason) {
			applyFromReason(reason);
		}
	},
	{ immediate: true },
);

const formRef = ref<{ submit: () => void } | null>(null);

const submitForm = async (event: FormSubmitEvent<Schema>) => {
	const data = event.data;
	await reasonStore.updateReason(props.reasonCode, {
		description: data.description.trim(),
		type: data.type,
		is_active: data.is_active,
	});
};

const submit = () => {
	formRef.value?.submit();
};

defineExpose({ submit });
</script>
