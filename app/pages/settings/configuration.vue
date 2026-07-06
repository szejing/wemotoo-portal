<template>
	<ZPagePanel id="settings-configuration" :title="$t('nav.configuration')" back-to="/settings/system">
		<template #navbar-right>
			<UButton color="success" @click="onSave">
				<UIcon :name="ICONS.SAVE" class="w-4 h-4" />
				{{ $t('common.save') }}
			</UButton>
		</template>

		<div class="p-6 space-y-6">
			<div class="space-y-2">
				<h2 class="text-3xl font-bold text-gray-900 dark:text-white">{{ $t('nav.configuration') }}</h2>
				<p class="text-gray-600 dark:text-gray-400">{{ $t('pages.configurationPageDesc') }}</p>
			</div>

			<UTabs v-if="tabItems.length && !updating" v-model="activeTab" :items="tabItems" class="w-full">
				<template v-for="segment in segments" :key="segment.segment_code" #[segment.segment_code]>
					<UCard>
						<ZSettingSegment :segment="segment" />
					</UCard>
				</template>
			</UTabs>
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { ZModalLoading } from '#components';
import { ICONS } from '~/utils/icons';
import type { TabsItem } from '@nuxt/ui';

const { t } = useI18n();
useHead({ title: () => t('pages.configurationTitle') });

const overlay = useOverlay();
const settingsStore = useSettingStore();
const loadingModal = overlay.create(ZModalLoading, { props: { key: 'loading' } });

const { segments, updating } = storeToRefs(settingsStore);
await settingsStore.getSettings();

watch(
	() => updating.value,
	(value: boolean) => {
		if (value) {
			loadingModal.open();
		} else {
			loadingModal.close();
		}
	},
);

const onSave = async () => {
	await settingsStore.updateSettings();
};

const activeTab = ref(segments.value[0]?.segment_code ?? '');

const tabItems = computed<TabsItem[]>(() =>
	segments.value.map((segment) => ({
		label: segment.segment_desc,
		icon: ICONS.SETTINGS_ROUNDED,
		slot: segment.segment_code,
		value: segment.segment_code,
	})),
);
</script>

<style scoped></style>
