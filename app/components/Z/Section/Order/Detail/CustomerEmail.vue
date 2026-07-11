<template>
	<UCard class="email-actions-card">
		<template #header>
			<div class="card-header">
				<h3 class="sidebar-title">
					<UIcon name="i-heroicons-envelope" class="w-5 h-5" />
					Customer email
				</h3>
			</div>
		</template>

		<div class="quick-actions">
			<p class="text-sm text-muted">
				<template v-if="resendEmailLabel && customerEmailAddress">
					Ready to resend {{ resendEmailLabel }} to
					<a :href="`mailto:${customerEmailAddress}`" class="customer-email-link">{{ customerEmailAddress }}</a>.
				</template>
				<template v-else>
					{{ description }}
				</template>
			</p>
			<UButton
				block
				color="primary"
				variant="soft"
				icon="i-heroicons-paper-airplane"
				:disabled="disabled"
				:loading="loading"
				data-testid="customer-email-resend"
				@click="emit('resend')"
			>
				{{ buttonText }}
			</UButton>
		</div>
	</UCard>
</template>

<script lang="ts" setup>
withDefaults(
	defineProps<{
		description: string;
		buttonText: string;
		resendEmailLabel?: string;
		customerEmailAddress?: string;
		disabled?: boolean;
		loading?: boolean;
	}>(),
	{
		disabled: false,
		loading: false,
	},
);

const emit = defineEmits<{
	resend: [];
}>();
</script>

<style scoped>
.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.sidebar-title {
	font-size: 1rem;
	font-weight: 600;
	color: var(--color-gray-800);
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.email-actions-card {
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	transition: box-shadow 0.2s ease;
}

.email-actions-card:hover {
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.quick-actions {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.text-muted {
	color: var(--ui-text-muted, var(--color-gray-500));
}

.customer-email-link {
	color: inherit;
	text-decoration: underline;
	text-underline-offset: 2px;
}

.customer-email-link:hover {
	color: var(--ui-primary, var(--color-primary-600));
}
</style>
