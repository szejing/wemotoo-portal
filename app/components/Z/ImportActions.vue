<template>
	<div class="flex flex-wrap items-center gap-2">
		<UButton color="secondary" variant="soft" :loading="downloadingTemplate" class="cursor-pointer" @click="emit('downloadTemplate')">
			<UIcon :name="ICONS.EXCEL" class="w-4 h-4" />
			{{ templateLabel }}
		</UButton>
		<UButton color="primary" variant="soft" :loading="importing" class="cursor-pointer" @click="openFilePicker">
			<UIcon :name="ICONS.UPLOAD" class="w-4 h-4" />
			{{ importLabel }}
		</UButton>
		<input ref="fileInputRef" type="file" class="hidden" :accept="accept" @change="onFileChange" />
	</div>
</template>

<script lang="ts" setup>
import { failedNotification } from '~/stores/AppUi/AppUi';

const props = withDefaults(
	defineProps<{
		accept: string;
		downloadingTemplate?: boolean;
		importing?: boolean;
		isAllowedFile?: (file: File) => boolean;
		formatErrorMessage?: string;
		templateLabel?: string;
		importLabel?: string;
	}>(),
	{
		downloadingTemplate: false,
		importing: false,
	},
);

const emit = defineEmits<{
	downloadTemplate: [];
	import: [file: File];
}>();

const { t } = useI18n();
const fileInputRef = ref<HTMLInputElement | null>(null);

const templateLabel = computed(() => props.templateLabel ?? t('common.downloadTemplate'));
const importLabel = computed(() => props.importLabel ?? t('common.import'));

const openFilePicker = () => {
	fileInputRef.value?.click();
};

const onFileChange = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	input.value = '';

	if (!file) return;

	if (props.isAllowedFile && !props.isAllowedFile(file)) {
		if (props.formatErrorMessage) {
			failedNotification(props.formatErrorMessage);
		}
		return;
	}

	emit('import', file);
};
</script>
