<template>
	<ZPagePanel id="customer-detail" :title="pageTitle" back-to="/customers">
		<div v-if="loading && !current_customer" class="w-full animate-in fade-in duration-200 space-y-6">
			<USkeleton class="h-32 w-full rounded-lg" />
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<USkeleton class="h-64 rounded-lg" />
				<div class="lg:col-span-2 space-y-4">
					<USkeleton class="h-10 w-96" />
					<USkeleton class="h-48 rounded-lg" />
				</div>
			</div>
		</div>

		<div v-else-if="customer_not_found" class="flex flex-col items-center justify-center py-16 gap-4">
			<UIcon name="i-heroicons-user-group" class="w-16 h-16 text-neutral-300" />
			<p class="text-default">{{ $t('pages.customerNotFound', { customerNo: custNo }) }}</p>
			<UButton color="primary" variant="soft" :to="'/customers'">{{ $t('nav.customers') }}</UButton>
		</div>

		<div v-else-if="current_customer" class="space-y-6 max-w-6xl">
			<!-- Customer header card -->
			<UCard>
				<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
					<div class="space-y-2">
						<h1 class="text-xl font-bold text-default">
							{{ current_customer.name || current_customer.customer_no }}
						</h1>
						<div class="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted">
							<span v-if="phoneDisplay" class="inline-flex items-center gap-1.5">
								<UIcon name="i-heroicons-phone" class="w-4 h-4 shrink-0" />
								{{ phoneDisplay }}
							</span>
							<span v-if="current_customer.email_address" class="inline-flex items-center gap-1.5">
								<UIcon name="i-heroicons-envelope" class="w-4 h-4 shrink-0" />
								{{ current_customer.email_address }}
							</span>
						</div>
						<div class="flex flex-wrap items-center gap-2 pt-1">
							<UBadge v-if="isVip" color="warning" variant="subtle" size="sm"> VIP </UBadge>
							<span class="text-sm text-muted"> {{ $t('pages.totalSpend') }}: {{ formatCurrency(current_customer.total_spent ?? 0, 'MYR') }} </span>
						</div>
					</div>
				</div>
			</UCard>

			<!-- Two-column: Profile Info + Tabs -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Left: Profile Info -->
				<UCard class="lg:col-span-1">
					<template #header>
						<h2 class="text-base font-semibold text-default">
							{{ $t('pages.profileInfo') }}
						</h2>
					</template>
					<dl class="space-y-3 text-sm">
						<div>
							<dt class="text-muted">{{ $t('common.name') }}</dt>
							<dd class="font-medium text-default mt-0.5">{{ current_customer.name || '—' }}</dd>
						</div>
						<div>
							<dt class="text-muted">{{ $t('common.phoneNo') }}</dt>
							<dd class="font-medium text-default mt-0.5">{{ phoneDisplay || '—' }}</dd>
						</div>
						<div>
							<dt class="text-muted">{{ $t('table.email') }}</dt>
							<dd class="font-medium text-default mt-0.5">{{ current_customer.email_address || '—' }}</dd>
						</div>
						<div>
							<dt class="text-muted">{{ $t('pages.joined') }}</dt>
							<dd class="font-medium text-default mt-0.5">{{ joinedDisplay }}</dd>
						</div>
						<div>
							<dt class="text-muted">{{ $t('pages.lastTransaction') }}</dt>
							<dd class="font-medium text-default mt-0.5">{{ lastActivityDisplay }}</dd>
						</div>
					</dl>
				</UCard>

				<!-- Right: Tabs -->
				<UCard class="lg:col-span-2">
					<UTabs v-model="activeTab" :items="tabItems" class="w-full">
						<!-- Overview -->
						<template #overview>
							<div class="space-y-6 py-2">
								<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<UCard class="bg-elevated/50">
										<p class="text-sm text-muted">{{ $t('pages.dashboardStatsOrders') }}</p>
										<p class="text-2xl font-bold text-default mt-1">{{ totalOrdersCount }}</p>
									</UCard>
									<UCard class="bg-elevated/50">
										<p class="text-sm text-muted">{{ $t('nav.appointments') }}</p>
										<p class="text-2xl font-bold text-default mt-1">{{ totalAppointmentsCount }}</p>
									</UCard>
									<UCard class="bg-elevated/50">
										<p class="text-sm text-muted">{{ $t('pages.totalSpend') }}</p>
										<p class="text-2xl font-bold text-success mt-1">
											{{ formatCurrency(current_customer.total_spent ?? 0, 'MYR') }}
										</p>
									</UCard>
								</div>
							</div>
						</template>

						<!-- Customer insights -->
						<!-- <template #insights>
							<div class="py-2">
								<CustomerInsightsPanel
									:customer-no="custNo"
									:insights="current_customer?.insights ?? []"
									:processing="processing"
									@add="handleAddInsight"
									@remove="handleRemoveInsight"
								/>
							</div>
						</template> -->

						<!-- Appointments -->
						<template #appointments>
							<div class="py-2">
								<UTable :data="pagedCustomerAppointments" :columns="appointmentColumns" :loading="appointmentsLoading">
									<template #empty>
										<div class="flex flex-col items-center justify-center py-12 gap-3">
											<UIcon name="i-heroicons-calendar-days" class="w-16 h-16 text-neutral-300" />
											<div class="text-center">
												<p class="font-medium text-default">{{ $t('pages.noAppointmentsFoundForCustomer') }}</p>
												<p class="text-sm text-muted mt-1 max-w-sm">
													{{ $t('pages.noAppointmentsFoundForCustomerDescription') }}
												</p>
											</div>
										</div>
									</template>
								</UTable>
								<div v-if="customer_appointments.length > appointmentsPagination.page_size" class="flex justify-end pt-4">
									<UPagination
										v-model="appointmentsPagination.current_page"
										:items-per-page="appointmentsPagination.page_size"
										:total="customer_appointments.length"
										@update:page="updateAppointmentsPage"
									/>
								</div>
							</div>
						</template>

						<!-- Orders -->
						<template #orders>
							<div class="py-2">
								<UTable
									:data="pagedCustomerOrders"
									:columns="orderColumns"
									:loading="loading"
									:ui="{ tr: 'cursor-pointer' }"
									@select="selectOrder"
								>
									<template #empty>
										<div class="flex flex-col items-center justify-center py-12 gap-3">
											<UIcon name="i-heroicons-shopping-cart" class="w-16 h-16 text-neutral-300" />
											<div class="text-center">
												<p class="font-medium text-default">{{ $t('pages.noOrdersFoundForCustomer') }}</p>
												<p class="text-sm text-muted mt-1 max-w-sm">
													{{ $t('pages.noOrdersFoundForCustomerDescription') }}
												</p>
											</div>
										</div>
									</template>
								</UTable>
								<div v-if="customer_orders.length > ordersPagination.page_size" class="flex justify-end pt-4">
									<UPagination
										v-model="ordersPagination.current_page"
										:items-per-page="ordersPagination.page_size"
										:total="customer_orders.length"
										@update:page="updateOrdersPage"
									/>
								</div>
							</div>
						</template>

						<!-- Invoices -->
						<!-- <template #invoices>
							<div class="py-2">
								<p class="text-sm text-muted">{{ $t('pages.noInvoicesFound') }}</p>
							</div>
						</template> -->
					</UTabs>
				</UCard>
			</div>
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import type { TableRow } from '@nuxt/ui';
import { formatCurrency } from 'yeppi-common';
import type { ItemModel } from '~/utils/models';
import { getCustomerAppointmentColumns, getCustomerOrderHistoryColumns } from '~/utils/table-columns';
import type { Appointment } from '~/utils/types/appointment';
import type { OrderHistory } from '~/utils/types/order-history';
import type { CustomerInsightKey, CustomerInsightConfidence, CustomerInsightSeverity } from 'yeppi-common';
import { customerInsightTraitOptions } from '~/utils/options/customer-insights';

const route = useRoute();
const custNo = computed(() => String(route.params.customer_no ?? ''));
const customer_not_found = ref(false);
const customerStore = useCustomerStore();
const appointmentStore = useAppointmentStore();
const { loading, processing, current_customer, customer_orders } = storeToRefs(customerStore);
const { t } = useI18n();

useHead({ title: () => t('pages.customerDetailTitle') });

const pageTitle = computed(() => {
	const c = current_customer.value;
	return c ? c.name || c.customer_no : t('pages.customerDetailTitle');
});

const phoneDisplay = computed(() => {
	const c = current_customer.value;
	if (!c?.dial_code && !c?.phone_no) return '';
	if (c?.dial_code && c?.phone_no) return `(${c.dial_code}) ${c.phone_no}`;
	return c?.dial_code ? `(${c.dial_code})` : c.phone_no;
});

const isVip = computed(() => (current_customer.value?.total_spent ?? 0) >= 1000);

const joinedDisplay = computed(() => {
	const c = current_customer.value;
	const d = c?.created_at;
	if (!d) return '—';
	try {
		const date = typeof d === 'string' ? new Date(d) : d;
		return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
	} catch {
		return '—';
	}
});

const lastActivityDisplay = computed(() => {
	const c = current_customer.value;
	const d = c?.last_transaction;
	if (!d) return '—';
	try {
		const date = typeof d === 'string' ? new Date(d) : d;
		return new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(date);
	} catch {
		return '—';
	}
});

const activeTab = ref('overview');
const tabItems = computed(() => [
	{ label: t('pages.overview'), value: 'overview', slot: 'overview' },
	// { label: t('pages.customerInsights.title'), value: 'insights', slot: 'insights' },
	{ label: t('nav.appointments'), value: 'appointments', slot: 'appointments' },
	{ label: t('nav.orders'), value: 'orders', slot: 'orders' },
	// { label: t('pages.invoices'), value: 'invoices', slot: 'invoices' },
]);

const totalOrdersCount = computed(() => customer_orders.value.length);
const totalAppointmentsCount = ref(0);
const customer_appointments = ref<Appointment[]>([]);
const appointmentsLoading = computed(() => appointmentStore.loading);

const appointmentColumns = computed(() => getCustomerAppointmentColumns(t));

const appointmentsPagination = reactive({
	current_page: 1,
	page_size: 10,
});

const pagedCustomerAppointments = computed(() => {
	const start = (appointmentsPagination.current_page - 1) * appointmentsPagination.page_size;
	const end = start + appointmentsPagination.page_size;
	return customer_appointments.value.slice(start, end);
});

const updateAppointmentsPage = (page: number) => {
	appointmentsPagination.current_page = page;
};

const formatOrderItemsSummary = (items: ItemModel[] | undefined): string => {
	if (!items?.length) return '—';
	return items.map((i) => (i.qty > 1 ? `${i.prod_name} (${i.qty}x)` : i.prod_name)).join(', ');
};

const orderColumns = computed(() => getCustomerOrderHistoryColumns(t, formatOrderItemsSummary));

const ordersPagination = reactive({
	current_page: 1,
	page_size: 10,
});

const pagedCustomerOrders = computed(() => {
	const start = (ordersPagination.current_page - 1) * ordersPagination.page_size;
	const end = start + ordersPagination.page_size;
	return customer_orders.value.slice(start, end);
});

const updateOrdersPage = (page: number) => {
	ordersPagination.current_page = page;
};

const selectOrder = (_e: Event, row: TableRow<OrderHistory>) => {
	const order = row.original;
	if (!order?.order_no) return;

	navigateTo(`/orders/${encodeURIComponent(order.order_no)}?type=${order.type}`);
};

const handleAddInsight = async (payload: { key: CustomerInsightKey; note?: string; confidence?: string; severity?: string }) => {
	const trait = customerInsightTraitOptions(t).find((item) => item.value === payload.key);
	if (!trait) return;

	await customerStore.addCustomerInsight(custNo.value, {
		key: payload.key,
		category: trait.category,
		note: payload.note,
		confidence: payload.confidence as CustomerInsightConfidence | undefined,
		severity: payload.severity as CustomerInsightSeverity | undefined,
	});
};

const handleRemoveInsight = async (insightId: string) => {
	await customerStore.removeCustomerInsight(custNo.value, insightId);
};

const onEdit = () => {
	// TODO: navigate to edit customer or open modal
};

const onOrder = () => {
	// TODO: navigate to create order with customer pre-filled
};

const onAppointment = () => {
	// TODO: navigate to create appointment with customer pre-filled
};

onBeforeMount(async () => {
	const [customer, orders, appointments] = await Promise.all([
		customerStore.getCustomer(custNo.value),
		customerStore.getCustomerOrders(custNo.value),
		appointmentStore.getAppointmentsByCustomer(custNo.value),
	]);
	if (!customer) {
		customer_not_found.value = true;
		return;
	}

	current_customer.value = customer;
	customer_orders.value = orders ?? [];
	customer_appointments.value = appointments ?? [];
	totalAppointmentsCount.value = customer_appointments.value.length;
});

watch(
	() => customer_orders.value.length,
	(total) => {
		const maxPage = Math.max(1, Math.ceil(total / ordersPagination.page_size));
		if (ordersPagination.current_page > maxPage) {
			ordersPagination.current_page = 1;
		}
	},
);

watch(
	() => customer_appointments.value.length,
	(total) => {
		const maxPage = Math.max(1, Math.ceil(total / appointmentsPagination.page_size));
		if (appointmentsPagination.current_page > maxPage) {
			appointmentsPagination.current_page = 1;
		}
	},
);
</script>
