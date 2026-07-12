<template>
	<UCard>
		<template #header>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div class="flex items-center gap-2 min-w-0">
					<UIcon name="i-heroicons-truck" class="w-5 h-5 shrink-0 text-main" />
					<h3 class="text-base font-semibold">{{ $t('components.shipment.title') }}</h3>
				</div>
				<div v-if="shipment" class="flex flex-wrap items-center gap-2">
					<UBadge :color="getShipmentStatusColor(shipment.status)" variant="subtle">
						{{ $t(statusLabel) }}
					</UBadge>
				</div>
			</div>
		</template>

		<div class="space-y-4">
			<UBadge v-if="shippingMethodLabel" color="neutral" variant="subtle" size="md">
				{{ shippingMethodLabel }}
			</UBadge>

			<div v-if="shipment" class="space-y-4">
				<div v-if="isPendingPlaceholder" class="flex gap-2 rounded-lg border border-warning/35 bg-warning/10 px-3 py-2.5 text-sm text-default" role="status">
					<UIcon name="i-heroicons-clock" class="w-5 h-5 shrink-0 text-warning" />
					<p class="leading-snug">{{ $t('components.shipment.pendingShipmentHint') }}</p>
				</div>

				<dl class="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
					<div class="flex flex-col gap-1">
						<dt class="text-xs font-medium text-muted">{{ $t('components.shipment.courierName') }}</dt>
						<dd class="flex items-center gap-2 font-medium text-default">
							<UIcon name="i-heroicons-building-office-2" class="w-4 h-4 shrink-0 text-muted" aria-hidden="true" />
							<span class="truncate">{{ courierDisplay }}</span>
						</dd>
					</div>

					<div class="flex flex-col gap-1 min-w-0">
						<dt class="text-xs font-medium text-muted">{{ $t('components.shipment.trackingNo') }}</dt>
						<dd class="flex flex-wrap items-center gap-2 font-medium">
							<span class="tabular-nums break-all">{{ trackingDisplay }}</span>
							<UButton
								v-if="hasRawTrackingNumber"
								data-testid="shipment-copy-tracking"
								color="primary"
								variant="ghost"
								size="xs"
								square
								icon="i-heroicons-clipboard-document"
								:aria-label="$t('components.shipment.copyTrackingNo')"
								@click="copyTrackingNumber"
							/>
						</dd>
					</div>

					<div class="flex flex-col gap-1 sm:col-span-2">
						<dt class="text-xs font-medium text-muted">{{ $t('components.shipment.shippingFee') }}</dt>
						<dd class="flex items-center gap-2 font-semibold text-default">
							<UIcon name="i-heroicons-banknotes" class="w-4 h-4 shrink-0 text-muted" aria-hidden="true" />
							<span>{{ formattedShippingFee }}</span>
						</dd>
					</div>

					<template v-if="shippedAtLabel || deliveredAtLabel">
						<div v-if="shippedAtLabel" class="flex flex-col gap-1">
							<dt class="text-xs font-medium text-muted">{{ $t('components.shipment.shippedAt') }}</dt>
							<dd class="text-default">{{ shippedAtLabel }}</dd>
						</div>
						<div v-if="deliveredAtLabel" class="flex flex-col gap-1">
							<dt class="text-xs font-medium text-muted">{{ $t('components.shipment.deliveredAt') }}</dt>
							<dd class="text-default">{{ deliveredAtLabel }}</dd>
						</div>
					</template>
				</dl>

				<div class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
					<div class="flex flex-wrap gap-2">
						<UButton
							v-if="canMarkShipped"
							size="sm"
							color="primary"
							icon="i-heroicons-truck"
							data-testid="shipment-mark-shipped"
							:disabled="isReadOnly || loading"
							:loading="loading && canMarkShipped"
							@click="handleMarkShipped"
						>
							{{ $t('components.shipment.markAsShipped') }}
						</UButton>
						<UButton
							v-if="canMarkDelivered"
							size="sm"
							color="success"
							icon="i-heroicons-check-badge"
							:disabled="isReadOnly || loading"
							:loading="loading && canMarkDelivered"
							@click="handleMarkDelivered"
						>
							{{ $t('components.shipment.markAsDelivered') }}
						</UButton>
						<UButton size="sm" color="neutral" variant="soft" icon="i-heroicons-pencil-square" :disabled="isReadOnly || loading" @click="openEditShipmentModal">
							{{ $t('common.edit') }}
						</UButton>
					</div>
					<UButton size="sm" color="error" variant="soft" icon="i-heroicons-trash" :disabled="isReadOnly || loading" @click="handleDeleteShipment">
						{{ $t('common.delete') }}
					</UButton>
				</div>
			</div>

			<div
				v-else
				class="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-default bg-elevated/30 px-4 py-10 text-center"
				data-testid="shipment-empty"
			>
				<div class="flex size-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
					<UIcon name="i-heroicons-cube-transparent" class="size-8 text-muted" aria-hidden="true" />
				</div>
				<div class="space-y-1">
					<p class="font-medium text-default">{{ $t('components.shipment.noShipment') }}</p>
					<p class="text-sm text-muted max-w-sm">{{ $t('components.shipment.noShipmentHint') }}</p>
				</div>
				<UButton color="primary" data-testid="shipment-create" :icon="ICONS.ADD_OUTLINE" :disabled="isReadOnly || loading" @click="openCreateShipmentModal">
					{{ $t('components.shipment.createShipment') }}
				</UButton>
			</div>

			<p v-if="isReadOnly" class="text-xs text-muted">{{ $t('components.shipment.readOnlyHint') }}</p>
		</div>
	</UCard>
</template>

<script lang="ts" setup>
import { LazyShipmentCreationModal, ZModalConfirmation } from '#components';
import { formatCurrency } from 'yeppi-common';
import { ICONS } from '~/utils/icons';
import { getShipmentStatusColor } from '~/utils/options';
import { useCourierStore } from '~/stores/Courier/Courier';
import { useShipmentStore } from '~/stores/Shipment/Shipment';
import type { OrderHistory } from '~/utils/types/order-history';

const props = defineProps<{
	order?: OrderHistory;
	isReadOnly?: boolean;
}>();

const emit = defineEmits<{
	refresh: [];
}>();

const { t } = useI18n();
const toast = useToast();
const overlay = useOverlay();
const shipmentStore = useShipmentStore();
const courierStore = useCourierStore();

const shipment = computed(() => props.order?.shipment);

const isPendingPlaceholder = computed(() => {
	const s = shipment.value;
	if (!s || s.status !== 'pending') {
		return false;
	}
	const courier = (s.courier_name ?? '').trim();
	const tracking = (s.tracking_no ?? '').trim();
	return !courier && !tracking;
});

const courierDisplay = computed(() => {
	const s = shipment.value;
	const c = (s?.courier_name ?? '').trim();
	return c || t('components.shipment.notYetProvided');
});

const rawTrackingNumber = computed(() => (shipment.value?.tracking_no ?? '').trim());

const hasRawTrackingNumber = computed(() => rawTrackingNumber.value.length > 0);

const trackingDisplay = computed(() => {
	const x = rawTrackingNumber.value;
	return x || t('components.shipment.notYetProvided');
});

const currencyCode = computed(() => props.order?.currency.code ?? 'MYR');

const formattedShippingFee = computed(() => formatCurrency(Number(shipment.value?.shipping_fee ?? 0), currencyCode.value));

const formatOptionalDateTime = (value: string | Date | null | undefined) => {
	if (value == null || value === '') {
		return '';
	}
	try {
		return new Date(value).toLocaleString();
	} catch {
		return '';
	}
};

const shippedAtLabel = computed(() => formatOptionalDateTime(shipment.value?.shipped_at));
const deliveredAtLabel = computed(() => formatOptionalDateTime(shipment.value?.delivered_at));

const shippingMethodLabel = computed(() => {
	const o = props.order;
	if (!o) return '';
	return o.shipping_method?.description ?? (o.shipping_method_id != null ? `#${o.shipping_method_id}` : '');
});

const loading = computed(() => shipmentStore.creating || shipmentStore.updating || shipmentStore.removing);

const shipmentModalCouriers = computed(() => courierStore.activeCouriers);

const loadCouriers = async () => {
	if (courierStore.activeCouriers.length) {
		return;
	}

	await courierStore.getCouriers({
		$top: 100,
		$count: true,
		$orderby: 'name asc',
		$filter: 'is_active eq true',
	});
};

const resolveShipmentCourierId = (courierId: number | null | undefined, courierName: string | null | undefined) => {
	if (courierId != null) {
		return courierId;
	}

	const normalized = (courierName ?? '').trim().toLowerCase();
	if (!normalized) {
		return undefined;
	}

	return shipmentModalCouriers.value.find((courier) => courier.name.trim().toLowerCase() === normalized)?.id;
};

const statusLabel = computed(() => {
	if (!shipment.value) {
		return 'options.pending';
	}

	const labels: Record<string, string> = {
		pending: 'options.pending',
		shipped: 'options.shipped',
		in_transit: 'options.inTransit',
		delivered: 'options.delivered',
		failed: 'options.failed',
	};

	return labels[shipment.value.status] ?? 'options.pending';
});

const canMarkShipped = computed(() => {
	return shipment.value?.status === 'pending' && hasRawTrackingNumber.value;
});

const canMarkDelivered = computed(() => {
	return shipment.value?.status === 'shipped' || shipment.value?.status === 'in_transit';
});

const copyTrackingNumber = async () => {
	const text = rawTrackingNumber.value;
	if (!text) {
		toast.add({ title: t('components.shipment.copyTrackingFailed'), color: 'warning' });
		return;
	}
	try {
		await navigator.clipboard.writeText(text);
		toast.add({ title: t('components.shipment.copyTrackingSuccess'), color: 'success' });
	} catch {
		toast.add({ title: t('components.shipment.copyTrackingFailed'), color: 'error' });
	}
};

const openCreateShipmentModal = async () => {
	if (props.isReadOnly || !props.order) {
		return;
	}

	await loadCouriers();

	const rec = props.order;
	const shipmentModal = overlay.create(LazyShipmentCreationModal, {
		props: {
			open: true,
			couriers: shipmentModalCouriers.value,
			mode: 'create' as const,
			title: t('components.shipment.createShipment'),
			submitLabel: t('common.create'),
			initialValue: {
				courier_id: undefined,
				courier_name: '',
				tracking_no: '',
			},
			save: async (payload) => {
				const shippingMethodId = rec.shipping_method?.id ?? rec.shipping_method_id;
				if (shippingMethodId == null) {
					toast.add({ title: t('components.shipment.shippingMethod') + ' ' + t('common.required'), color: 'error' });
					throw new Error('Missing shipping method');
				}

				await shipmentStore.createShipment({
					order_no: rec.order_no,
					inv_no: rec.inv_no,
					shipping_method_id: Number(shippingMethodId),
					courier_id: payload.courier_id,
					courier_name: payload.courier_name,
					tracking_no: payload.tracking_no,
				});
			},
		},
	});

	const instance = shipmentModal.open();
	const saved = await instance.result;
	if (saved) {
		emit('refresh');
	}
};

const openEditShipmentModal = async () => {
	if (!props.order?.shipment || props.isReadOnly) {
		return;
	}

	await loadCouriers();

	const rec = props.order;
	const ship = rec.shipment!;
	const shipmentId = ship.id;

	const shipmentModal = overlay.create(LazyShipmentCreationModal, {
		props: {
			open: true,
			couriers: shipmentModalCouriers.value,
			mode: 'update' as const,
			title: t('components.shipment.updateShipment'),
			submitLabel: t('common.save'),
			initialValue: {
				courier_id: resolveShipmentCourierId(ship.courier_id, ship.courier_name),
				courier_name: ship.courier_name ?? '',
				tracking_no: ship.tracking_no ?? '',
			},
			save: async (payload) => {
				await shipmentStore.updateShipment(shipmentId, {
					courier_id: payload.courier_id,
					courier_name: payload.courier_name,
					tracking_no: payload.tracking_no,
				});
			},
		},
	});

	const instance = shipmentModal.open();
	const saved = await instance.result;
	if (saved) {
		emit('refresh');
	}
};

const handleDeleteShipment = async () => {
	if (!props.order?.shipment?.id || props.isReadOnly) {
		return;
	}

	const shipmentId = props.order.shipment.id;

	const confirmModal = overlay.create(ZModalConfirmation, {
		props: {
			message: t('components.shipment.confirmDelete'),
			action: 'delete',
			onConfirm: async () => {
				await shipmentStore.deleteShipment(shipmentId);
				confirmModal.close();
				emit('refresh');
			},
			onCancel: () => {
				confirmModal.close();
			},
		},
	});

	confirmModal.open();
};

const handleMarkShipped = async () => {
	if (!props.order?.shipment?.id || props.isReadOnly) {
		return;
	}

	await shipmentStore.markShipped(props.order.shipment.id);
	emit('refresh');
};

const handleMarkDelivered = async () => {
	if (!props.order?.shipment?.id || props.isReadOnly) {
		return;
	}

	await shipmentStore.markDelivered(props.order.shipment.id);
	emit('refresh');
};

onMounted(() => {
	loadCouriers().catch(() => undefined);
});
</script>
