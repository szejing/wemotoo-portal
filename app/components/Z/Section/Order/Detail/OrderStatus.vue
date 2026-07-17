<template>
	<UCard class="status-management-card">
		<template #header>
			<div class="card-header-sidebar">
				<h3 class="sidebar-title">
					<UIcon name="i-heroicons-clipboard-document-check" class="w-5 h-5" />
					{{ $t('components.orderDetail.orderStatus') }}
				</h3>
				<UBadge v-if="currentStatus" :color="statusBadgeColor" variant="subtle" size="sm" class="capitalize">
					{{ statusBadgeLabel }}
				</UBadge>
			</div>
		</template>

		<div class="status-section">
			<ZSelectMenuOrderStatus v-model:status="status" />
			<UButton block color="primary" :icon="ICONS.SAVE" :disabled="status === currentStatus || updating" :loading="updating" @click="emit('submit')">
				{{ $t('components.orderDetail.updateOrderStatus') }}
			</UButton>
		</div>
	</UCard>
</template>

<script lang="ts" setup>
import type { OrderStatus } from 'yeppi-common';
import { getOrderStatusColor, getOrderStatusOption } from '~/utils/options';
import { ICONS } from '~/utils/icons';

const props = defineProps<{
	currentStatus?: OrderStatus;
	updating?: boolean;
}>();

const emit = defineEmits<{
	submit: [];
}>();

const status = defineModel<OrderStatus>('status', { required: true });
const { t } = useI18n();

const statusBadgeColor = computed(() => (props.currentStatus ? getOrderStatusColor(props.currentStatus) ?? 'neutral' : 'neutral'));
const statusBadgeLabel = computed(() => {
	if (!props.currentStatus) return '';
	return getOrderStatusOption(t, props.currentStatus)?.label ?? props.currentStatus;
});
</script>

<style scoped>
.card-header-sidebar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
}

.sidebar-title {
	font-size: 1rem;
	font-weight: 600;
	color: var(--color-gray-800);
	display: flex;
	align-items: center;
	gap: 0.5rem;
	min-width: 0;
}

.status-management-card {
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-section {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}
</style>
