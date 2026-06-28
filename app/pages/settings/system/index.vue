<template>
	<ZPagePanel id="settings-system" :title="$t('nav.systemSettings')" back-to="/settings">
		<div class="space-y-4">
			<div class="space-y-1">
				<h2 class="text-3xl font-bold text-gray-900 dark:text-white">{{ $t('nav.systemSettings') }}</h2>
				<p class="text-gray-500 dark:text-gray-400">{{ $t('pages.systemSettingsDesc') }}</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<ZSettingsGroup
					v-for="group in systemGroups"
					:key="group.title"
					:title="group.title"
					:description="group.description"
					:icon="group.icon"
					:color="group.color"
					:items="group.items"
				/>
			</div>
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { ICONS } from '~/utils/icons';

const { t } = useI18n();
useHead({ title: () => t('pages.systemSettingsTitle') });

const systemGroups = computed(() => [
	{
		title: t('nav.systemSettings'),
		description: t('pages.settingsMenuDesc'),
		icon: ICONS.SETTINGS_ROUNDED,
		color: 'slate' as const,
		items: [
			{ label: t('nav.configuration'), to: '/settings/configuration' },
			{ label: t('nav.reasons'), to: '/settings/reasons' },
		],
	},
]);
</script>
