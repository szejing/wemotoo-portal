<template>
	<ZPagePanel id="reason-create" :title="$t('pages.createReasonTitle')" back-to="/settings/reasons" grow>
		<div class="container w-full mx-auto">
			<FormReasonCreation ref="formRef" @saved="onSaved" />
		</div>

		<template #footer>
			<div class="w-full backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-800 shadow-md z-50">
				<div class="mx-auto px-4 sm:px-6 py-4">
					<div class="hidden md:flex justify-end items-center gap-3">
						<UButton color="neutral" variant="outline" size="lg" @click="goBack">{{ $t('common.cancel') }}</UButton>
						<UButton color="success" variant="solid" size="lg" :loading="adding" @click="onSubmit">
							<UIcon :name="ICONS.CHECK_ROUNDED" />
							{{ $t('pages.createReasonButton') }}
						</UButton>
					</div>
					<div class="md:hidden flex flex-col gap-2">
						<UButton color="success" size="md" class="w-full" :loading="adding" @click="onSubmit">
							<UIcon :name="ICONS.CHECK_ROUNDED" class="w-4 h-4" />
							<span class="text-sm">{{ $t('pages.createReasonButton') }}</span>
						</UButton>
						<UButton color="neutral" variant="outline" size="sm" class="w-full" @click="goBack">
							<span class="text-xs">{{ $t('common.cancel') }}</span>
						</UButton>
					</div>
				</div>
			</div>
		</template>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { ICONS } from '~/utils/icons';
import type { Reason } from '~/utils/types/reason';

const { t } = useI18n();
const reasonStore = useReasonStore();
const { adding } = storeToRefs(reasonStore);
const formRef = ref<{ submit: () => void } | null>(null);

useHead({ title: () => t('pages.createReasonPageTitle') });

const onSubmit = () => {
	formRef.value?.submit();
};

const goBack = () => {
	useRouter().back();
};

const onSaved = async (_reason: Reason | undefined) => {
	await navigateTo('/settings/reasons');
};
</script>
