<template>
	<ZPagePanel id="settings" :title="$t('nav.settings')">
		<div class="space-y-4">
			<div class="space-y-1">
				<h2 class="text-3xl font-bold text-gray-900 dark:text-white">{{ $t('nav.settings') }}</h2>
				<p class="text-gray-500 dark:text-gray-400">{{ $t('pages.settingsDesc') }}</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<ZSettingsGroup
					v-for="group in settingsGroups"
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

useHead({ title: () => t('pages.settingsTitle') });

const settingsGroups = computed(() => [
	{
		title: t('nav.paymentSettings'),
		description: t('pages.paymentManagementDesc'),
		icon: ICONS.PAYMENT_METHODS,
		color: 'green' as const,
		items: [{ label: t('nav.paymentMethods'), to: '/settings/payment/methods' }],
	},
	{
		title: t('nav.taxSettings'),
		description: t('pages.taxManagementDesc'),
		icon: ICONS.TAX,
		color: 'blue' as const,
		items: [
			{ label: t('nav.taxCodes'), to: '/settings/taxes/codes' },
			{ label: t('nav.taxRules'), to: '/settings/taxes/rules' },
		],
	},
	{
		title: t('nav.storeProfile'),
		description: t('pages.storeProfileDesc'),
		icon: ICONS.USER_GROUP_ROUNDED,
		color: 'pink' as const,
		items: [{ label: t('nav.storeProfile'), to: '/settings/store-profile' }],
	},
	{
		title: t('nav.systemSettings'),
		description: t('pages.settingsMenuDesc'),
		icon: ICONS.SETTINGS_ROUNDED,
		color: 'slate' as const,
		items: [{ label: t('nav.systemSettings'), to: '/settings/system' }],
	},
	{
		title: t('nav.shippingSettings'),
		description: t('pages.shippingSettingsDesc'),
		icon: ICONS.ORDER,
		color: 'green' as const,
		items: [
			{ label: t('pages.shippingMethods'), to: '/settings/shipping/methods' },
			{ label: t('nav.shippingZones'), to: '/settings/shipping/zones' },
		],
	},
]);
</script>
