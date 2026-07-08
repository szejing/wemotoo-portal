<template>
	<ZPagePanel id="orders-detail" :title="$t('pages.orderDetail')" back-to="/orders">
		<ZLoading v-if="loading" />
		<div v-else-if="order_not_found" class="order-not-found">
			<UIcon name="i-heroicons-magnifying-glass-circle" class="order-not-found-icon" />
			<p class="order-not-found-text">{{ $t('pages.orderNotFound', { orderNo: order_no_param }) }}</p>
			<UButton color="primary" variant="soft" :to="'/orders'">{{ $t('nav.orders') }}</UButton>
		</div>
		<div v-else class="order-detail-container pb-[calc(5.5rem+env(safe-area-inset-bottom,0))] lg:pb-0">
			<!-- Header Section -->
			<div class="order-header">
				<div class="order-header-left">
					<div class="order-header-title">
						<h1 class="order-number">{{ record?.order_no }}</h1>
					</div>
					<div class="flex flex-col">
						<div v-if="record?.order_date_time" class="metadata-item">
							<UIcon :name="ICONS.CALENDAR" class="w-4 h-4 text-main" />
							<p>{{ record?.order_date_time }}</p>
						</div>
						<div v-if="record?.inv_no" class="metadata-item">
							<p class="text-base text-neutral-400 italic">{{ record?.inv_no }}</p>
						</div>
						<div v-if="record?.ref_no" class="metadata-item">
							<p>{{ $t('components.orderDetail.refLabel') }}: {{ record?.ref_no }}</p>
						</div>
						<div v-if="record" class="metadata-item fulfillment-meta mt-2">
							<UIcon
								:name="(record?.order_type ?? OrderType.PICKUP) === OrderType.DELIVERY ? 'i-heroicons-truck' : 'i-heroicons-building-storefront'"
								class="w-4 h-4 shrink-0 text-main"
							/>
							<div class="flex flex-wrap items-center gap-1.5">
								<UBadge color="primary" variant="subtle" size="md">
									{{ order_fulfillment_method_label }}
								</UBadge>
							</div>
						</div>
					</div>
				</div>
				<div class="order-header-right">
					<div class="status-badges">
						<UButton
							color="primary"
							:icon="ICONS.SYNC_ROUNDED"
							variant="ghost"
							:disabled="is_refreshing || refresh_cooldown > 0"
							:loading="is_refreshing"
							:class="{ 'spin-icon': is_refreshing }"
							@click="refreshOrder"
						>
							{{ refresh_button_text }}
						</UButton>

						<div class="status-badge-stack">
							<div class="status-group">
								<UBadge v-if="order?.status === OrderStatus.PENDING_PAYMENT" variant="subtle" color="info" size="lg">{{ $t('options.pendingPayment') }}</UBadge>
								<UBadge v-else-if="String(order?.status) === 'paid'" color="info" size="lg">{{ $t('options.paid') }}</UBadge>
								<UBadge v-else-if="order?.status === OrderStatus.PROCESSING" color="info" size="lg">{{ $t('options.processing') }}</UBadge>
								<UBadge v-else-if="String(order?.status) === 'shipped'" color="primary" size="lg">{{ $t('options.shipped') }}</UBadge>
								<UBadge v-else-if="String(order?.status) === 'delivered'" color="success" size="lg">{{ $t('options.delivered') }}</UBadge>
								<UBadge v-else-if="order?.status === OrderStatus.COMPLETED" color="success" size="lg">{{ $t('options.completed') }}</UBadge>
								<UBadge v-else-if="order?.status === OrderStatus.REQUIRES_ACTION" color="warning" size="lg">{{ $t('options.requiresAction') }}</UBadge>
								<UBadge v-else-if="order?.status === OrderStatus.REFUNDED" color="error" size="lg">{{ $t('options.refunded') }}</UBadge>
								<UBadge v-else-if="order?.status === OrderStatus.CANCELLED" color="error" size="lg">{{ $t('options.cancelled') }}</UBadge>
							</div>
							<p v-if="order?.last_updated" class="status-last-updated" :title="$t('table.lastUpdated')">
								{{ order.last_updated }}
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Main Grid Layout -->
			<div class="wrapper-grid">
				<div class="main-wrapper">
					<!-- Customer Detail -->
					<UCard class="customer-card">
						<template #header>
							<div class="card-header">
								<h2 class="card-title">
									<UIcon :name="ICONS.CUSTOMER_GROUP_ROUNDED" class="w-5 h-5" />
									{{ $t('components.orderDetail.customerInformation') }}
								</h2>
								<UButton variant="ghost" size="sm" @click="editCustomerDetail">
									<UIcon name="i-heroicons-pencil" class="w-3 h-3" />
									{{ $t('components.orderDetail.edit') }}
								</UButton>
							</div>
						</template>
						<ZSectionOrderDetailCustomer :customer="customer" />
					</UCard>

					<!-- Order Items -->
					<UCard v-if="orderForModal" class="items-card">
						<template #header>
							<div class="card-header">
								<h2 class="card-title">
									<UIcon :name="ICONS.PRODUCT" class="w-5 h-5" />
									{{ $t('components.orderDetail.orderItems') }}
								</h2>
								<div class="flex items-center gap-2">
									<span v-if="order?.status === OrderStatus.PENDING_PAYMENT" class="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
										<UIcon name="i-heroicons-pencil" class="w-3 h-3" />
										{{ $t('components.orderDetail.editable') }}
									</span>
									<span v-else-if="order?.status === OrderStatus.COMPLETED" class="text-xs text-green-600 font-medium">
										<UIcon name="i-heroicons-pencil" class="w-3 h-3" />
										{{ $t('components.orderDetail.editable') }}
									</span>
									<UPopover v-else overlay>
										<UButton color="neutral" :trailing-icon="ICONS.QUESTION_MARK" variant="soft" size="xs" />
										<template #content>
											<div class="p-4 max-w-xs">
												<p class="text-sm">
													{{ $t('components.orderDetail.orderNotEditableMessage') }}<br />
													<b class="text-primary">{{ $t('components.orderDetail.changeStatusToEdit') }}</b>
												</p>
											</div>
										</template>
									</UPopover>
								</div>
							</div>
						</template>

						<UTable :data="items ?? []" :columns="order_detail_item_columns" :meta="order_items_table_meta" class="w-full" @select="onOrderItemRowSelect">
							<template #item-cell="{ row }">
								<ZSectionOrderDetailItems column="item" :item="row.original" :currency-code="currency_code" />
							</template>
							<template #unitSellPrice-cell="{ row }">
								<ZSectionOrderDetailItems column="unitSellPrice" :item="row.original" :currency-code="currency_code" />
							</template>
							<template #qty-cell="{ row }">
								<ZSectionOrderDetailItems column="qty" :item="row.original" :currency-code="currency_code" />
							</template>
							<template #lineTotal-cell="{ row }">
								<ZSectionOrderDetailItems column="lineTotal" :item="row.original" :currency-code="currency_code" />
							</template>
						</UTable>

						<div class="order-items-bill-summary border-default divide-y divide-default border-t">
							<div class="grid grid-cols-[2fr_1fr_1fr_1fr] items-center">
								<div class="col-span-2" />
								<div class="p-4 text-left text-muted italic font-normal">{{ $t('components.orderDetail.subTotal') }}</div>
								<div class="p-4 text-center font-bold text-lg italic">{{ formatCurrency(record?.gross_amt ?? 0, currency_code) }}</div>
							</div>
							<div v-if="(record?.order_type ?? OrderType.PICKUP) === OrderType.DELIVERY" class="grid grid-cols-[2fr_1fr_1fr_1fr] items-center">
								<div class="col-span-2" />
								<div class="p-4 text-left text-muted italic font-normal">
									{{ $t('components.shipment.shippingFee') }}
									<span v-if="shipping_fee_method_hint" class="text-xs font-normal not-italic text-muted leading-tight max-w-full">
										{{ shipping_fee_method_hint }}
									</span>
								</div>
								<div class="p-4 text-center font-bold text-lg italic">
									<div class="flex flex-col items-center gap-0.5">
										<span>{{ formatCurrency(record?.shipment?.shipping_fee ?? 0, currency_code) }}</span>
									</div>
								</div>
							</div>
							<div v-for="tax in record?.taxes ?? []" :key="tax.tax_code" class="grid grid-cols-[2fr_1fr_1fr_1fr] items-center">
								<div class="col-span-2" />
								<div class="p-4 text-left text-muted italic font-normal">{{ tax.tax_desc }}</div>
								<div class="p-4 text-center text-error italic">-{{ formatCurrency(tax.tax_amt, currency_code) }}</div>
							</div>
							<div class="grid grid-cols-[2fr_1fr_1fr_1fr] items-center border-b-4 border-double border-default">
								<div class="col-span-2" />
								<div class="p-4 text-left italic font-bold">{{ $t('components.orderDetail.netTotal') }}</div>
								<div class="p-4 text-center font-bold text-lg italic">{{ formatCurrency(order?.payable_total ?? 0, currency_code) }}</div>
							</div>
						</div>
					</UCard>

					<!-- Remarks Section -->
					<UCard v-if="record?.remarks" class="remarks-card">
						<template #header>
							<div class="card-header">
								<h2 class="card-title">
									<UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-5 h-5" />
									{{ $t('components.orderDetail.remarks') }}
								</h2>
							</div>
						</template>
						<p class="remarks-text">{{ record?.remarks }}</p>
					</UCard>

					<Activities :activities="activityLogEntries" />
				</div>

				<!-- Sidebar (desktop) -->
				<div v-if="record !== undefined && isLgUp" class="side-wrapper">
					<div class="sticky-sidebar">
						<ZSectionOrderDetailOrderStatus
							v-model:status="new_order_status"
							:current-status="order?.status"
							:updating="updating"
							@submit="handleUpdateOrderStatus"
						/>

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
								<p class="text-sm text-muted">{{ resend_email_description }}</p>
								<UButton
									block
									color="primary"
									variant="soft"
									icon="i-heroicons-paper-airplane"
									:disabled="!can_resend_status_email"
									:loading="is_resending_email"
									@click="handleResendCurrentStatusEmail"
								>
									{{ resend_email_button_text }}
								</UButton>
							</div>
						</UCard>

						<ZSectionOrderDetailPayment :order="orderForModal" @refresh="refreshOrder" />

						<!-- Shipment Information -->
						<div v-if="(record?.order_type ?? OrderType.PICKUP) === OrderType.DELIVERY">
							<ZSectionOrderDetailShipment :order="orderForModal" :is-read-only="isSaleReadOnly" @refresh="getOrderDetails" />
						</div>
					</div>
				</div>
			</div>

			<!-- Mobile: sticky entry to order actions drawer (status, payment, shipment) -->
			<div
				v-if="record !== undefined && !isLgUp"
				class="mobile-actions-bar fixed inset-x-0 bottom-0 z-40 border-t border-default bg-default/95 px-4 pt-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
			>
				<UDrawer v-model:open="isOrderActionsOpen" :title="$t('components.orderDetail.orderActionsTitle')" direction="bottom">
					<UButton block color="primary" :icon="ICONS.SETTINGS_ROUNDED" class="mobile-actions-open-trigger w-full">
						{{ $t('components.orderDetail.manageOrder') }}
					</UButton>
					<template #body>
						<div class="mobile-actions-drawer-body space-y-4 max-h-[min(70vh,32rem)] overflow-y-auto overscroll-contain px-0.5 pb-4">
							<ZSectionOrderDetailOrderStatus
								v-model:status="new_order_status"
								:current-status="order?.status"
								:updating="updating"
								@submit="handleUpdateOrderStatus"
							/>

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
									<p class="text-sm text-muted">{{ resend_email_description }}</p>
									<UButton
										block
										color="primary"
										variant="soft"
										icon="i-heroicons-paper-airplane"
										:disabled="!can_resend_status_email"
										:loading="is_resending_email"
										@click="handleResendCurrentStatusEmail"
									>
										{{ resend_email_button_text }}
									</UButton>
								</div>
							</UCard>

							<ZSectionOrderDetailPayment :order="orderForModal" @refresh="refreshOrder" />

							<div v-if="(record?.order_type ?? OrderType.PICKUP) === OrderType.DELIVERY">
								<ZSectionOrderDetailShipment :order="orderForModal" :is-read-only="isSaleReadOnly" @refresh="getOrderDetails" />
							</div>
						</div>
					</template>
				</UDrawer>
			</div>
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import type { TableRow } from '@nuxt/ui';
import type { TableMeta, Row } from '@tanstack/vue-table';
import { ZModalConfirmation, ZModalInformation, ZModalOrderDetailCustomer, ZModalOrderDetailItem } from '#components';
import { OrderItemStatus, OrderStatus, OrderType, PaymentStatus, formatCurrency } from 'yeppi-common';
import { failedNotification, successNotification } from '~/stores/AppUi/AppUi';
import { ICONS } from '~/utils/icons';
import type { ItemModel } from '~/utils/models/item.model';
import type { OrderHistory } from '~/utils/types/order-history';
import { getOrderDetailItemColumns } from '~/utils/table-columns';
import Activities from '~/components/ActivityLog/Activities.vue';
import { useFulfillmentStore } from '~/stores/Fulfillment/Fulfillment';
import { useMediaQuery } from '@vueuse/core';

const orderStore = useOrderStore();
const saleStore = useSaleStore();
const fulfillmentStore = useFulfillmentStore();
const { updating, resending_email: order_resending_email } = storeToRefs(orderStore);
const { resending_email: sale_resending_email } = storeToRefs(saleStore);

const loading = computed(() => orderStore.loading || saleStore.loading);

const route = useRoute();
const order_not_found = ref(false);
const isLgUp = useMediaQuery('(min-width: 1024px)');
const isOrderActionsOpen = ref(false);

watch(isLgUp, (lg) => {
	if (lg) {
		isOrderActionsOpen.value = false;
	}
});
const order_no_param = computed(() => String(route.params.order_no ?? ''));
const type = computed(() => String(route.query.type ?? ''));
const isSaleReadOnly = computed(() => type.value === 'sale');

const order = ref<OrderHistory | undefined>();

const record = computed(() => order.value);

const activityLogEntries = computed(() => {
	if (record.value?.activities?.length) {
		return record.value.activities;
	}
	return record.value?.logs;
});

/** Shipping method name when present; otherwise delivery vs pickup label */
const order_fulfillment_method_label = computed(() => {
	const r = record.value;
	const desc = r?.shipping_method?.description?.trim();
	if (desc) {
		return desc;
	}
	const isDelivery = (r?.order_type ?? OrderType.PICKUP) === OrderType.DELIVERY;
	return isDelivery ? t('components.orderDetail.orderTypeDelivery') : t('components.orderDetail.orderTypePickup');
});

/** Shipment snapshot first, then order-level method (for bill summary hint). */
const shipping_fee_method_hint = computed(() => {
	const r = record.value;
	const fromShipment = r?.shipment?.shipping_method?.description?.trim();
	if (fromShipment) {
		return fromShipment;
	}
	return r?.shipping_method?.description?.trim() ?? '';
});

const orderForModal = computed((): OrderHistory | undefined => {
	return order.value;
});

type ResendEmailAction = 'order-confirmation' | 'invoice' | 'receipt' | 'refund' | 'cancellation';

const overlay = useOverlay();
const new_order_status = ref<OrderStatus>(OrderStatus.PENDING_PAYMENT);

const customer = computed(() => record.value?.customer);

const items = computed(() => record.value?.items);
const currency_code = computed(() => record.value?.currency.code);

const { t } = useI18n();

const order_detail_items_editable = computed(() => order.value?.status === OrderStatus.PENDING_PAYMENT);

const order_detail_item_columns = computed(() => getOrderDetailItemColumns(t));

const is_cash_pending_record = computed(() => {
	const current = order.value;
	const paymentMethod = String(current?.metadata?.payment_method ?? '').trim().toUpperCase();

	return (
		paymentMethod === 'CASH' &&
		(current?.status === OrderStatus.PENDING_PAYMENT || current?.status === OrderStatus.PROCESSING || current?.status === OrderStatus.CONFIRMED) &&
		current?.payment_status === PaymentStatus.PENDING
	);
});

const resend_email_action = computed<ResendEmailAction | undefined>(() => {
	const current = order.value;
	if (!current) return undefined;

	if (is_cash_pending_record.value) {
		return 'order-confirmation';
	}

	if (current.status === OrderStatus.PROCESSING && current.payment_status === PaymentStatus.PENDING) {
		return 'invoice';
	}

	if (
		(current.status === OrderStatus.PROCESSING || current.status === OrderStatus.PAID || current.status === OrderStatus.COMPLETED) &&
		current.payment_status === PaymentStatus.PAID
	) {
		return 'receipt';
	}

	if (current.status === OrderStatus.REFUNDED && current.payment_status === PaymentStatus.REFUNDED) {
		return 'refund';
	}

	if (current.status === OrderStatus.CANCELLED) {
		return 'cancellation';
	}

	return undefined;
});

const resend_email_label = computed(() => {
	switch (resend_email_action.value) {
		case 'order-confirmation':
			return 'order confirmation';
		case 'invoice':
			return 'invoice';
		case 'receipt':
			return 'receipt';
		case 'refund':
			return 'refund receipt';
		case 'cancellation':
			return 'cancellation email';
		default:
			return '';
	}
});

const can_resend_status_email = computed(() => !!record.value?.customer?.email_address && !!resend_email_action.value);
const is_resending_email = computed(() => (type.value === 'order' ? order_resending_email.value : sale_resending_email.value));
const resend_email_description = computed(() => {
	if (!record.value?.customer?.email_address) {
		return 'Customer email is missing.';
	}
	if (!resend_email_action.value) {
		return 'No email available for this status.';
	}
	return `Ready to resend ${resend_email_label.value} to ${record.value.customer.email_address}.`;
});
const resend_email_button_text = computed(() => {
	if (!resend_email_action.value) {
		return 'No email available';
	}
	return `Resend ${resend_email_label.value}`;
});

const order_items_table_meta = computed<TableMeta<ItemModel>>(() => ({
	class: {
		tr: (row: Row<ItemModel>) =>
			order_detail_items_editable.value && row.original.status === OrderItemStatus.ACTIVE ? 'cursor-pointer hover:bg-neutral-50' : '',
	},
}));

const openOrderItemEdit = (item: ItemModel) => {
	if (!orderForModal.value) return;

	if (item.status === OrderItemStatus.ACTIVE) {
		const itemModal = overlay.create(ZModalOrderDetailItem, {
			props: {
				order: orderForModal.value,
				item: JSON.parse(JSON.stringify(item)),
				onCancel: () => {
					itemModal.close();
				},
				onUpdate: (requiresRefresh: boolean) => {
					if (requiresRefresh) {
						onItemsRefresh();
					}
					itemModal.close();
				},
			},
		});

		itemModal.open();
	} else {
		const infoModal = overlay.create(ZModalInformation, {
			props: {
				title: 'Warning',
				message: 'Unable to edit this item because it is already voided by customer.',
				action: 'confirm',
				onConfirm: () => {
					infoModal.close();
				},
			},
		});

		infoModal.open();
	}
};

const onOrderItemRowSelect = (_e: Event, row: TableRow<ItemModel>) => {
	const item = row.original;
	if (!item || !order_detail_items_editable.value) return;
	if (item.status !== OrderItemStatus.ACTIVE) return;
	openOrderItemEdit(item);
};

const REFRESH_COOLDOWN_SECONDS = 5;
const refresh_cooldown = ref(0);
const is_refreshing = ref(false);
let cooldown_interval: NodeJS.Timeout | null = null;

const isMobile = ref(false);

const checkMobile = () => {
	isMobile.value = window.innerWidth < 640;
};

watch(
	() => order.value?.status,
	(newStatus) => {
		if (newStatus) {
			new_order_status.value = newStatus as OrderStatus;
		}
	},
);

useHead({ title: () => t('pages.orderDetailTitle') + (record.value?.order_no ?? '') });

onMounted(() => {
	checkMobile();
	window.addEventListener('resize', checkMobile);
	getOrderDetails();
});

onBeforeRouteLeave(() => {
	order.value = undefined;
	if (cooldown_interval) {
		clearInterval(cooldown_interval);
	}
});

onBeforeUnmount(() => {
	if (cooldown_interval) {
		clearInterval(cooldown_interval);
	}
	window.removeEventListener('resize', checkMobile);
});

const getOrderDetails = async () => {
	try {
		if (type.value === 'order') {
			const data = await orderStore.getOrderByOrderNo(order_no_param.value);
			order.value = data;
		} else {
			const data = await saleStore.getBillDetailByOrderNo(order_no_param.value);
			order.value = data;
		}
	} catch {
		order_not_found.value = true;
	}
};

const onItemsRefresh = () => {
	return getOrderDetails();
};

const handleFulfillmentAction = async (action: 'processing' | 'packed' | 'fulfilled') => {
	if (!record.value?.order_no || isSaleReadOnly.value) {
		return;
	}

	if (action === 'processing') {
		await fulfillmentStore.markProcessing(record.value.order_no);
	} else if (action === 'packed') {
		await fulfillmentStore.markPacked(record.value.order_no);
	} else {
		await fulfillmentStore.markFulfilled(record.value.order_no);
	}

	await getOrderDetails();
};

const refreshOrder = async () => {
	if (is_refreshing.value || refresh_cooldown.value > 0) {
		return;
	}

	if (!record.value?.order_no) return;

	is_refreshing.value = true;

	try {
		await getOrderDetails();
		successNotification(t('components.orderDetail.refreshSuccess'));

		refresh_cooldown.value = REFRESH_COOLDOWN_SECONDS;

		if (cooldown_interval) {
			clearInterval(cooldown_interval);
		}

		cooldown_interval = setInterval(() => {
			refresh_cooldown.value -= 1;
			if (refresh_cooldown.value <= 0) {
				if (cooldown_interval) {
					clearInterval(cooldown_interval);
					cooldown_interval = null;
				}
			}
		}, 1000);
	} catch (error) {
		console.error('Failed to refresh:', error);
	} finally {
		is_refreshing.value = false;
	}
};

const refresh_button_text = computed(() => {
	if (isMobile.value) {
		return '';
	}

	if (refresh_cooldown.value > 0) {
		return t('components.orderDetail.waitSeconds', { n: refresh_cooldown.value });
	}
	return t('components.orderDetail.refresh');
});

const handleUpdateOrderStatus = async () => {
	await updateOrderStatus(new_order_status.value);
};

const handleResendCurrentStatusEmail = async () => {
	if (!record.value?.order_no || !can_resend_status_email.value) {
		return;
	}

	try {
		if (type.value === 'order') {
			await orderStore.resendCurrentStatusEmail(record.value.order_no);
		} else {
			await saleStore.resendCurrentStatusEmail(record.value.order_no);
		}
	} catch {
		// Store actions show the failure toast.
	}
};

const executeOrderStatusUpdate = async (new_status: OrderStatus) => {
	if (!order.value) {
		throw new Error('Order not found');
	}

	if (new_status == OrderStatus.COMPLETED && order.value.payment_status == PaymentStatus.PENDING) {
		failedNotification(t('components.orderDetail.paymentInfoRequired'));
		return;
	}

	try {
		const shouldStay = await orderStore.updateStatus(order.value.order_no, order.value.customer.customer_no, new_status, type.value);
		if (shouldStay) {
			await getOrderDetails();
			successNotification(t('components.orderDetail.statusUpdateSuccess'));
		} else {
			useRouter().back();
		}
	} catch {
		failedNotification(t('components.orderDetail.error'));
	}
};

const updateOrderStatus = async (new_status: OrderStatus) => {
	if (!order.value) {
		throw new Error('Order not found');
	}

	if (new_status == OrderStatus.CANCELLED) {
		const confirmModal = overlay.create(ZModalConfirmation, {
			props: {
				message: t('components.orderDetail.confirmCancelOrder'),
				titleVariant: 'danger',
				action: 'delete',
				onConfirm: async () => {
					await executeOrderStatusUpdate(new_status);
					confirmModal.close();
				},
				onCancel: () => {
					confirmModal.close();
				},
			},
		});
		confirmModal.open();
		return;
	}

	await executeOrderStatusUpdate(new_status);
};

const editCustomerDetail = async () => {
	if (!customer.value || !record.value) return;

	const customerModal = overlay.create(ZModalOrderDetailCustomer, {
		props: {
			orderNo: record.value.order_no,
			customer: JSON.parse(JSON.stringify(customer.value)),
			onUpdate: () => {
				customerModal.close();
				refreshOrder();
			},
			onCancel: () => {
				customerModal.close();
			},
		},
	});

	customerModal.open();
};
</script>

<style scoped>
.order-detail-container {
	max-width: 1600px;
}

.order-not-found {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem 1.5rem;
	text-align: center;
	gap: 1rem;
}

.order-not-found-icon {
	width: 3rem;
	height: 3rem;
	color: var(--color-gray-400);
}

.order-not-found-text {
	color: var(--color-gray-600);
	font-size: 1rem;
	max-width: 28rem;
}

.order-header {
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 1rem;
	align-items: start;
	border-radius: 1rem;
	padding: 2rem;
	margin-bottom: 2rem;
	box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

@media (min-width: 768px) {
	.order-header {
		gap: 2rem;
	}
}

.order-header-left {
	min-width: 0;
}

.order-header-title {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.order-number {
	font-size: 1.875rem;
	font-weight: 700;
	line-height: 1.2;
	margin: 0;
}

.metadata-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
}

.order-header-right {
	display: flex;
	justify-content: flex-end;
	align-items: flex-start;
}

.status-badges {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	align-items: flex-end;
}

.status-badge-stack {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 0.375rem;
}

.status-group {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	align-items: flex-start;
}

@media (min-width: 768px) {
	.status-group {
		align-items: flex-end;
	}
}

.status-last-updated {
	margin: 0;
	max-width: min(100%, 18rem);
	text-align: right;
	font-size: 0.6875rem;
	line-height: 1.25;
	font-variant-numeric: tabular-nums;
	color: var(--ui-text-muted, var(--color-gray-500));
	opacity: 0.75;
}

.wrapper-grid {
	display: grid;
	grid-template-columns: repeat(1, minmax(0, 1fr));
	gap: 1.5rem;
}

@media (min-width: 1024px) {
	.wrapper-grid {
		grid-template-columns: repeat(12, minmax(0, 1fr));
	}
}

.main-wrapper {
	grid-column: span 1 / span 1;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

@media (min-width: 1024px) {
	.main-wrapper {
		grid-column: span 8 / span 8;
	}
}

.side-wrapper {
	grid-column: span 4 / span 4;
}

.sticky-sidebar {
	position: sticky;
	top: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.card-title {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.125rem;
	font-weight: 600;
	color: var(--color-gray-800);
}

.customer-card,
.items-card,
.remarks-card,
.email-actions-card {
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	transition: box-shadow 0.2s ease;
}

.customer-card:hover,
.items-card:hover,
.remarks-card:hover,
.email-actions-card:hover {
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.remarks-text {
	font-size: 0.875rem;
	color: var(--color-gray-700);
	line-height: 1.6;
	white-space: pre-wrap;
}

.quick-actions-card {
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-actions {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

@media (max-width: 640px) {
	.order-header {
		padding: 1.5rem;
		gap: 1rem;
		grid-template-columns: 1fr auto;
	}

	.order-number {
		font-size: 1.5rem;
	}

	.status-badges {
		gap: 0.75rem;
	}
}

.spin-icon :deep(svg) {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
</style>
