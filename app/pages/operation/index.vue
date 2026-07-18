<template>
	<ZPagePanel id="operation" :title="$t('nav.operation')">
		<div class="space-y-4">
			<div class="space-y-1">
				<h2 class="text-3xl font-bold text-gray-900 dark:text-white">{{ $t('pages.operationManagement') }}</h2>
				<p class="text-gray-500 dark:text-gray-400">{{ $t('pages.operationManagementDesc') }}</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<ZSettingsGroup
					v-for="group in operationGroups"
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
useHead({ title: () => t('pages.operationTitle') });

const operationGroups = computed(() => [
	{
		title: t('pages.operationOptions'),
		description: t('pages.operationOptionsDesc'),
		icon: ICONS.USER_GROUP_ROUNDED,
		color: 'blue' as const,
		items: [
			{ label: t('nav.shipmentArrangement'), to: '/operation/shipment-arrangement' },
			{ label: t('nav.staffs'), to: '/operation/staff' },
			// { label: t('nav.staffDepartments'), to: '/operation/staff-departments' },
			{ label: t('nav.outlets'), to: '/operation/outlets' },
		],
	},
]);
</script>
