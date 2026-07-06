<template>
	<div v-if="!shouldHide">
		<div v-if="filteredSettingTempls.length > 0">
			<ZSettingTemplate :templates="filteredSettingTempls" />
		</div>

		<div v-for="child in visibleChildren" :key="child.seq_no" class="pb-2">
			<h2 class="segment-desc font-bold bg-gray-100 dark:bg-gray-800">{{ child.segment_desc }}</h2>
			<ZSettingTemplate :templates="child.filteredTempls" />
		</div>
	</div>
</template>

<script lang="ts" setup>
import type { SettingSegment } from '~/utils/types/setting-segment';

const props = defineProps({
	segment: {
		type: Object as PropType<SettingSegment>,
		required: true,
	},
});

const { segment } = toRefs(props);

const filterExternalTemplates = (templates: SettingSegment['setting_templs'] | undefined) =>
	(templates ?? []).filter((template) => !template.is_internal);

// Filter out internal templates for the main segment
const filteredSettingTempls = computed(() => filterExternalTemplates(segment.value.setting_templs));

// Filter out internal templates for child segments and only show children with external templates
const visibleChildren = computed(() =>
	(segment.value.segment_children ?? [])
		.map((child) => ({
			...child,
			filteredTempls: filterExternalTemplates(child.setting_templs),
		}))
		.filter((child) => child.filteredTempls.length > 0),
);

// Hide the entire segment if no external templates exist in main segment or any children
const shouldHide = computed(() => {
	return filteredSettingTempls.value.length === 0 && visibleChildren.value.length === 0;
});
</script>

<style scoped>
.segment-desc {
	padding: 0.5rem 1rem;
	border-radius: 0.375rem;
}
</style>
