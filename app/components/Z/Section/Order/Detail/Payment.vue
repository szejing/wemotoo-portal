<template>
	<UCard class="payment-info-card">
		<template #header>
			<div class="card-header-sidebar">
				<h3 class="sidebar-title">
					<UIcon name="i-heroicons-banknotes" class="w-5 h-5" />
					{{ $t('components.orderDetail.paymentInformation') }}
				</h3>
				<UButton v-if="order?.payments?.length == 0" variant="ghost" size="xs" :icon="ICONS.ADD_OUTLINE" @click="addPaymentInfo" />
				<div v-if="order?.payment_status === PaymentStatus.PAID" class="status-group">
					<UBadge color="success" size="lg">
						<UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
						{{ $t('components.orderDetail.paid') }}
					</UBadge>
				</div>
			</div>
		</template>

		<div v-if="order?.payments && order.payments.length > 0" class="payments-list">
			<div v-for="payment in order.payments" :key="payment.payment_line" class="payment-item" @click="viewPaymentInfo(payment)">
				<div class="payment-header">
					<span class="payment-type">{{ payment.payment_type_desc }}</span>
					<span class="payment-amount">{{ payment.currency_code }} {{ payment.payment_amt?.toFixed(2) }}</span>
				</div>
				<div v-if="payment.ref_no1" class="payment-ref">
					<span class="payment-ref-label">{{ $t('components.orderDetail.refLabel') }}:</span>
					<span class="payment-ref-value">{{ payment.ref_no1 }}</span>
				</div>
				<div class="payment-date">
					<UIcon name="i-heroicons-clock" class="w-3 h-3" />
					{{ getFormattedDate(payment.payment_date_time, 'dd MMM yyyy HH:mm') }}
				</div>
			</div>
		</div>
		<div v-else class="payment-empty">
			<UIcon name="i-heroicons-currency-dollar" class="w-12 h-12 text-neutral-300" />
			<p class="payment-empty-text">{{ $t('components.orderDetail.noPaymentRecorded') }}</p>
			<UButton size="sm" color="primary" :icon="ICONS.ADD_OUTLINE" @click="addPaymentInfo">
				{{ $t('components.orderDetail.addPayment') }}
			</UButton>
		</div>
	</UCard>
</template>

<script lang="ts" setup>
import { ZModalOrderDetailPayment } from '#components';
import { PaymentStatus, getFormattedDate } from 'yeppi-common';
import type { PaymentModel } from '~/utils/models';
import type { OrderHistory } from '~/utils/types/order-history';
import { ICONS } from '~/utils/icons';

const props = defineProps<{
	order?: OrderHistory;
}>();

const emit = defineEmits<{
	refresh: [];
}>();

const overlay = useOverlay();

const addPaymentInfo = () => {
	if (!props.order) return;

	const paymentModal = overlay.create(ZModalOrderDetailPayment, {
		props: {
			order: props.order,
			onUpdate: () => {
				paymentModal.close();
				emit('refresh');
			},
			onCancel: () => {
				paymentModal.close();
			},
		},
	});

	paymentModal.open();
};

const viewPaymentInfo = (payment: PaymentModel) => {
	if (!props.order) return;

	const paymentModal = overlay.create(ZModalOrderDetailPayment, {
		props: {
			order: props.order,
			payment: payment,
			onUpdate: () => {
				paymentModal.close();
				emit('refresh');
			},
			onCancel: () => {
				paymentModal.close();
			},
		},
	});

	paymentModal.open();
};
</script>

<style scoped>
.card-header-sidebar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
}

.sidebar-title {
	font-size: 1rem;
	font-weight: 600;
	color: var(--color-gray-800);
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.payment-info-card {
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.payments-list {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.payment-item {
	padding: 1rem;
	background: var(--color-gray-50);
	border-radius: 0.5rem;
	border: 1px solid var(--color-gray-200);
	cursor: pointer;
	transition: all 0.2s ease;
}

.payment-item:hover {
	background: var(--color-gray-100);
	border-color: var(--color-primary-300);
	transform: translateY(-2px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.payment-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.5rem;
}

.payment-type {
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--color-gray-800);
}

.payment-amount {
	font-size: 1rem;
	font-weight: 700;
	color: var(--color-primary-600);
}

.payment-ref {
	display: flex;
	gap: 0.5rem;
	font-size: 0.75rem;
	margin-bottom: 0.25rem;
}

.payment-ref-label {
	color: var(--color-gray-500);
}

.payment-ref-value {
	color: var(--color-gray-700);
	font-weight: 500;
}

.payment-date {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.75rem;
	color: var(--color-gray-500);
}

.payment-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 2rem;
	text-align: center;
	gap: 1rem;
}

.payment-empty-text {
	color: var(--color-gray-500);
	font-size: 0.875rem;
}
</style>
