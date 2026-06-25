<template>
	<div class="space-y-3 rounded-md border border-neutral-200/70 bg-neutral-100/45 p-4 dark:border-neutral-700/70 dark:bg-neutral-800/35">
		<h4 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">{{ label }}</h4>

		<div v-if="metadataFields.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<UFormField v-for="field in metadataFields" :key="field.key" :label="field.key" :name="`${name}.${field.key}`" :error="fieldErrors[field.key]">
				<USwitch v-if="field.type === 'boolean'" v-model="field.value" :label="field.value ? $t('common.active') : $t('common.inactive')" />
				<UInput v-else-if="field.type === 'number'" v-model="field.value" type="number" />
				<UTextarea v-else-if="field.type === 'json'" v-model="field.value" :rows="4" class="font-mono text-xs md:col-span-2" />
				<UInput v-else v-model="field.value" />
			</UFormField>
		</div>

		<p v-else class="text-sm text-muted">{{ emptyLabel }}</p>
	</div>
</template>

<script lang="ts" setup>
import { buildMetadata, createMetadataFields } from '~/utils/metadata-fields';

const props = withDefaults(
	defineProps<{
		modelValue?: Record<string, unknown>;
		label?: string;
		name?: string;
		emptyLabel?: string;
	}>(),
	{
		label: undefined,
		name: 'metadata',
		emptyLabel: undefined,
	},
);

const emit = defineEmits<{
	'update:modelValue': [value: Record<string, unknown> | undefined];
}>();

const { t } = useI18n();
const metadataFields = reactive(createMetadataFields(props.modelValue));
const fieldErrors = reactive<Record<string, string>>({});

const label = computed(() => props.label ?? t('pages.metadata'));
const emptyLabel = computed(() => props.emptyLabel ?? t('common.notSet'));

const clearErrors = () => {
	for (const key of Object.keys(fieldErrors)) {
		delete fieldErrors[key];
	}
};

const validate = () => {
	clearErrors();

	const result = buildMetadata(metadataFields);
	if (result.ok) {
		emit('update:modelValue', result.metadata);
		return result;
	}

	fieldErrors[result.key] = result.message;
	return result;
};

defineExpose({
	validate,
});
</script>

<style scoped></style>
