<template>
	<div class="flex flex-col gap-1.5 min-w-0" :class="wrapperClass">
		<label v-if="showLabel" class="text-xs font-medium text-gray-700 dark:text-gray-300">
			{{ label || $t('components.filter.status') }}
		</label>
		<USelectMenu
			v-model="selected"
			multiple
			:items="items"
			value-key="value"
			:placeholder="placeholder || $t('components.selectMenu.selectStatus')"
			:disabled="disabled"
			color="neutral"
			variant="outline"
			class="w-full min-w-48 sm:min-w-56"
			:search-input="{
				placeholder: 'Search status…',
				icon: 'i-lucide-search',
			}"
			:ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform' }"
		>
			<template #default>
				<div v-if="selectedLabels.length > 0" class="flex flex-wrap gap-1.5 min-w-0">
					<template v-if="getColor">
						<UBadge
							v-for="entry in selectedLabels"
							:key="entry.value"
							:color="getColor(entry.value) ?? 'neutral'"
							variant="subtle"
							class="truncate"
						>
							{{ entry.label }}
						</UBadge>
					</template>
					<template v-else>
						<span
							v-for="entry in selectedLabels"
							:key="entry.value"
							class="text-sm text-default truncate"
						>
							{{ entry.label }}
						</span>
					</template>
				</div>
				<span v-else class="text-neutral-400">{{ placeholder || $t('components.selectMenu.selectStatus') }}</span>
			</template>

			<template #item="{ item }">
				<UBadge
					v-if="getColor"
					:color="getColor(item.value) ?? 'neutral'"
					variant="subtle"
					class="truncate"
				>
					{{ item.label }}
				</UBadge>
				<span v-else>{{ item.label }}</span>
			</template>
		</USelectMenu>
	</div>
</template>

<script lang="ts" setup>
import type { UiBadgeColor } from 'yeppi-common';

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
		getColor?: (value: string) => UiBadgeColor | undefined;
	}>(),
	{
		modelValue: () => [],
		label: undefined,
		placeholder: undefined,
		showLabel: false,
		disabled: false,
		wrapperClass: undefined,
		getColor: undefined,
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

const selectedLabels = computed(() => {
	const values = selected.value;
	return values.map((value) => {
		const match = props.items.find((item) => item.value === value);
		return { value, label: match?.label ?? value };
	});
});
</script>

<style scoped></style>
