<template>
	<div class="flex flex-col gap-1.5 min-w-0" :class="wrapperClass">
		<label v-if="showLabel" class="text-xs font-medium text-gray-700 dark:text-gray-300">
			{{ label || $t('components.filter.status') }}
		</label>
		<USelect
			v-model="selected"
			multiple
			:items="items"
			value-key="value"
			:placeholder="placeholder || $t('components.selectMenu.selectStatus')"
			:disabled="disabled"
			color="neutral"
			variant="outline"
			class="w-full min-w-48 sm:min-w-56"
			:ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform' }"
		/>
	</div>
</template>

<script lang="ts" setup>
export type StatusFilterItem = {
	label: string;
	value: string;
};

const props = withDefaults(
	defineProps<{
		modelValue?: string[];
		items: StatusFilterItem[];
		label?: string;
		placeholder?: string;
		showLabel?: boolean;
		disabled?: boolean;
		wrapperClass?: string;
	}>(),
	{
		modelValue: () => [],
		label: undefined,
		placeholder: undefined,
		showLabel: false,
		disabled: false,
		wrapperClass: undefined,
	},
);

const emit = defineEmits<{
	'update:modelValue': [value: string[]];
}>();

const selected = computed({
	get() {
		return props.modelValue ?? [];
	},
	set(value: string[] | undefined) {
		emit('update:modelValue', Array.isArray(value) ? value : []);
	},
});
</script>

<style scoped></style>
