<template>
	<div class="flex flex-wrap items-center gap-2">
		<UButton color="secondary" variant="soft" :loading="downloadingTemplate" class="cursor-pointer" @click="emit('downloadTemplate')">
			<UIcon :name="ICONS.EXCEL" class="w-4 h-4" />
			{{ templateLabel }}
		</UButton>
		<UButton color="primary" variant="soft" :loading="importing" class="cursor-pointer" @click="startImport">
			<UIcon :name="ICONS.UPLOAD" class="w-4 h-4" />
			{{ importLabel }}
		</UButton>
		<input ref="fileInputRef" type="file" class="hidden" :accept="accept" @change="onFileChange" />
		<UModal v-model:open="sourceModalOpen" :title="sourceModalTitle" :ui="{ content: 'w-full sm:max-w-lg' }">
			<template #body>
				<div class="flex flex-row gap-2">
					<UButton v-for="source in importSources" :key="source.value" color="neutral" variant="outline" class="min-w-0 flex-1 justify-start text-left" @click="selectImportSource(source.value)">
						<div class="flex min-w-0 flex-col items-start gap-1">
							<span class="font-medium">{{ source.label }}</span>
							<span v-if="source.description" class="text-xs text-gray-500 dark:text-gray-400">{{ source.description }}</span>
						</div>
					</UButton>
				</div>
			</template>
		</UModal>
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
		importSources?: Array<{
			label: string;
			value: string;
			description?: string;
		}>;
		sourceModalTitle?: string;
	}>(),
	{
		downloadingTemplate: false,
		importing: false,
		importSources: () => [],
	},
);

const emit = defineEmits<{
	downloadTemplate: [];
	import: [file: File, importSource?: string];
}>();

const { t } = useI18n();
const fileInputRef = ref<HTMLInputElement | null>(null);
const sourceModalOpen = ref(false);
const selectedImportSource = ref<string | undefined>();

const templateLabel = computed(() => props.templateLabel ?? t('common.downloadTemplate'));
const importLabel = computed(() => props.importLabel ?? t('common.import'));
const sourceModalTitle = computed(() => props.sourceModalTitle ?? t('import.selectTemplate'));

const openFilePicker = () => {
	fileInputRef.value?.click();
};

const startImport = () => {
	if (props.importSources.length > 1) {
		sourceModalOpen.value = true;
		return;
	}

	selectedImportSource.value = props.importSources[0]?.value;
	openFilePicker();
};

const selectImportSource = (source: string) => {
	selectedImportSource.value = source;
	sourceModalOpen.value = false;
	openFilePicker();
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

	emit('import', file, selectedImportSource.value);
	selectedImportSource.value = undefined;
};
</script>
