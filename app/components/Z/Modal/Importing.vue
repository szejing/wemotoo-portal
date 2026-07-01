<template>
	<UModal
		:close="false"
		:dismissible="false"
		:ui="{
			content: 'w-full max-w-sm',
		}"
	>
		<template #body>
			<div class="flex flex-col items-center gap-4 px-2 py-4 text-center">
				<div class="relative flex h-16 w-16 items-center justify-center text-primary-600 dark:text-primary-300">
					<div
						data-testid="importing-icon-ring"
						class="absolute inset-0 rounded-full border-2 border-primary-100 border-t-primary-600 border-r-primary-400 motion-safe:animate-spin dark:border-primary-900 dark:border-t-primary-300 dark:border-r-primary-500"
					/>
					<div class="absolute inset-2 rounded-full bg-primary-50 dark:bg-primary-950" />
					<UIcon name="i-heroicons-arrow-up-tray" class="relative h-7 w-7 motion-safe:animate-bounce" />
				</div>

				<div class="space-y-1">
					<h3 class="text-base font-semibold text-gray-900 dark:text-white">
						{{ title ?? t('modal.importingTitle') }}
					</h3>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						{{ message ?? t('modal.importingMessage') }}
					</p>
				</div>
			</div>
		</template>
	</UModal>
</template>

<script lang="ts" setup>
const { t } = useI18n();

withDefaults(
	defineProps<{
		title?: string;
		message?: string;
	}>(),
	{
		title: undefined,
		message: undefined,
	},
);
</script>

<style scoped></style>
