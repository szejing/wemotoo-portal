<template>
	<ZPagePanel id="reason-edit" :title="panelTitle" back-to="/settings/reasons" grow>
		<div class="container w-full mx-auto">
			<FormReasonUpdateLoading v-if="isLoading" />
			<FormReasonUpdate
				v-else-if="current_reason"
				:key="current_reason.code"
				ref="formRef"
				:reason-code="current_reason.code"
				:initial-reason="current_reason"
			/>
		</div>

		<template #footer>
			<div v-if="current_reason" class="w-full backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-800 shadow-md z-50">
				<div class="mx-auto px-4 sm:px-6 py-4">
					<div class="hidden md:flex justify-between items-center gap-3">
						<UButton color="error" variant="ghost" size="lg" :loading="removing" @click="confirmDelete">
							<UIcon :name="ICONS.TRASH" />
							{{ $t('common.delete') }}
						</UButton>
						<div class="flex gap-3">
							<UButton color="neutral" variant="outline" size="lg" @click="goBack">{{ $t('common.cancel') }}</UButton>
							<UButton color="success" variant="solid" size="lg" :loading="updating" @click="onSubmit">
								<UIcon :name="ICONS.CHECK_ROUNDED" />
								{{ $t('common.save') }}
							</UButton>
						</div>
					</div>
					<div class="md:hidden flex flex-col gap-2">
						<UButton color="success" size="md" class="w-full" :loading="updating" @click="onSubmit">
							<UIcon :name="ICONS.CHECK_ROUNDED" class="w-4 h-4" />
							<span class="text-sm">{{ $t('common.save') }}</span>
						</UButton>
						<div class="flex gap-2">
							<UButton color="error" variant="ghost" size="sm" class="flex-1" :loading="removing" @click="confirmDelete">
								<UIcon :name="ICONS.TRASH" class="w-4 h-4" />
								<span class="text-xs">{{ $t('common.delete') }}</span>
							</UButton>
							<UButton color="neutral" variant="outline" size="sm" class="flex-1" @click="goBack">
								<span class="text-xs">{{ $t('common.cancel') }}</span>
							</UButton>
						</div>
					</div>
				</div>
			</div>
		</template>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { ZModalConfirmation } from '#components';
import { ICONS } from '~/utils/icons';

const route = useRoute();
const code = computed(() => route.params.code as string);

const overlay = useOverlay();
const { t } = useI18n();
const reasonStore = useReasonStore();
const { updating, removing, current_reason } = storeToRefs(reasonStore);
const formRef = ref<{ submit: () => void } | null>(null);

const isLoading = ref(true);

const panelTitle = computed(() => {
	const label = current_reason.value?.description || current_reason.value?.code;
	if (label) {
		return `${t('pages.editReasonTitle')}: ${label}`;
	}
	return t('pages.editReasonTitle');
});

useHead({
	title: () =>
		current_reason.value
			? `${t('pages.editReasonPageTitle')} — ${current_reason.value.description || current_reason.value.code}`
			: t('pages.editReasonPageTitle'),
});

onMounted(async () => {
	isLoading.value = true;
	try {
		const reason = await reasonStore.getReason(String(code.value));
		if (!reason) {
			await navigateTo('/settings/reasons');
		}
	} finally {
		isLoading.value = false;
	}
});

const onSubmit = () => {
	formRef.value?.submit();
};

const goBack = () => {
	useRouter().back();
};

const confirmDelete = () => {
	if (!current_reason.value) {
		return;
	}

	const reasonKey = current_reason.value.code;

	const confirmModal = overlay.create(ZModalConfirmation, {
		props: {
			message: t('components.reasonForm.confirmDelete'),
			action: 'delete',
			onConfirm: async () => {
				await reasonStore.deleteReason(reasonKey);
				confirmModal.close();
				await navigateTo('/settings/reasons');
			},
			onCancel: () => {
				confirmModal.close();
			},
		},
	});

	confirmModal.open();
};
</script>
