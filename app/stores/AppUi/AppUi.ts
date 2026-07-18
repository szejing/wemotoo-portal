import { defineStore } from 'pinia';
import type { ToastNotification } from '~/utils/types/event-notification';

// Grouped navigation structure for UDashboardGroup (labels are i18n keys)
const default_navigations = [
	// Main section
	{
		label: 'nav.main',
		links: [
			{
				label: 'nav.dashboard',
				icon: ICONS.DASHBOARD_ROUNDED,
				to: '/',
			},
			{
				label: 'nav.analytics',
				icon: ICONS.ANALYTICS,
				to: '/analytics',
				value: 'analytics',
				children: [
					{ label: 'nav.orderAnalytics', to: '/analytics/orders' },
					{ label: 'nav.salesAnalytics', to: '/analytics/sales' },
				],
			},
			// Only shown if service-based (excluded via setExcludeRoutes when not)
			{
				label: 'nav.appointments',
				icon: ICONS.CALENDAR,
				to: '/appointments',
			},
			// Sales
			{
				label: 'nav.orders',
				icon: ICONS.ORDER,
				to: '/orders',
				value: 'orders',
				children: [
					{ label: 'nav.shipmentArrangement', icon: 'i-lucide-package-search', to: '/orders/shipment-arrangement' },
					// Coming soon: { label: 'nav.payments', to: '/sales/payments' },
					// Coming soon: { label: 'nav.refunds', to: '/sales/refunds' },
				],
			},
			// {
			// 	label: 'nav.notifications',
			// 	icon: ICONS.BELL,
			// 	to: '/notifications',
			// },
			// Products
			{
				label: 'nav.products',
				icon: ICONS.PRODUCT,
				to: '/products',
				value: 'products',
				children: [
					{ label: 'nav.all_products', to: '/products/listing' },
					{ label: 'nav.categories', to: '/products/categories' },
					{ label: 'nav.brands', to: '/products/brands' },
					{ label: 'nav.tags', to: '/products/tags' },
					// Coming soon: { label: 'nav.inventory', to: '/products/inventory' },
				],
			},
			{
				label: 'nav.customers',
				icon: ICONS.CUSTOMER_GROUP_ROUNDED,
				to: '/customers',
			},
			// Marketing
			{
				label: 'nav.marketing',
				icon: ICONS.SPARKLES,
				to: '/marketing',
				value: 'marketing',
				children: [
					// { label: 'nav.discounts', to: '/marketing/discounts' },
					{ label: 'nav.shopVouchers', to: '/marketing/vouchers/shop' },
					{ label: 'nav.productVouchers', to: '/marketing/vouchers/product' },
					{ label: 'nav.affiliates', to: '/marketing/affiliates' },
					// { label: 'nav.campaigns', to: '/marketing/campaigns' },
					// { label: 'nav.automations', to: '/marketing/automations' },
				],
			},
			// Operation
			{
				label: 'nav.operation',
				icon: ICONS.USER_GROUP_ROUNDED,
				to: '/operation',
				value: 'operation',
				children: [
					{ label: 'nav.staffs', to: '/operation/staff' },
					{ label: 'nav.staffDepartments', to: '/operation/staff-departments' },
					{ label: 'nav.outlets', to: '/operation/outlets' },
				],
			},
			// Reports (coming soon)
			// {
			// 	label: 'nav.reports',
			// 	icon: ICONS.REPORT_ORDER,
			// 	to: '/reports',
			// },
			// Settings
			{
				label: 'nav.settings',
				icon: ICONS.SETTINGS_ROUNDED,
				to: '/settings',
				value: 'settings',
				children: [
					{ label: 'nav.storeProfile', to: '/settings/store-profile' },
					{ label: 'nav.systemSettings', to: '/settings/system' },
					{ label: 'nav.paymentSettings', to: '/settings/payment' },
					{ label: 'nav.taxSettings', to: '/settings/taxes' },
					{ label: 'nav.shippingSettings', to: '/settings/shipping' },
				],
			},
		],
	},
];

export const useAppUiStore = defineStore('appUiStore', {
	state: () => ({
		forcedShow: true as boolean,
		showSidebar: false as boolean,
		navigations: default_navigations,
		toastNotification: undefined as ToastNotification | undefined,
		modal: undefined as ToastNotification | undefined,
		excludeRoutes: [] as string[],
	}),
	actions: {
		toggleSidebar() {
			this.showSidebar = !this.showSidebar;
		},

		setExcludeRoutes(routes: string[]) {
			this.excludeRoutes = routes;
			const excluded = (value: string) => routes.includes(value);

			this.navigations = default_navigations.map((group) => ({
				...group,
				links: group.links
					.filter((link) => !excluded(link.label) && !excluded(link.to))
					.map((link) => {
						if (!link.children) return link;
						const filteredChildren = link.children.filter((child) => !excluded(child.label) && !excluded(child.to));
						return { ...link, children: filteredChildren };
					})
					.filter((link) => !link.children || link.children.length > 0),
			}));
		},

		showToast(notification: ToastNotification) {
			this.toastNotification = notification;

			if (this.toastNotification.id === undefined) {
				this.toastNotification.id = Date.now().toString();
			}

			if (this.toastNotification.timeout === undefined) {
				this.toastNotification.timeout = 3000;
			}

			if (this.toastNotification.closeButton === undefined) {
				this.toastNotification.closeButton = {
					icon: ICONS.CLOSE_ROUNDED,
					color: 'white',
					variant: 'link',
				};
			}
		},

		dismissToast() {
			this.toastNotification = undefined;
		},

		addModal(notification: ToastNotification) {
			this.modal = notification;

			if (this.modal.id === undefined) {
				this.modal.id = Date.now().toString();
			}

			if (this.modal.timeout === undefined) {
				this.modal.timeout = 3000;
			}

			if (this.modal.closeButton === undefined) {
				this.modal.closeButton = {
					icon: ICONS.CLOSE_ROUNDED,
					color: 'white',
					variant: 'link',
				};
			}
		},

		clearModal() {
			this.modal = undefined;
		},
	},
});

export const successNotification = (description: string) => {
	const appUiStore = useAppUiStore();
	appUiStore.showToast({
		color: 'success',
		icon: ICONS.CHECK_OUTLINE_ROUNDED,
		description,
	});
};

export const failedNotification = (description: string) => {
	const appUiStore = useAppUiStore();
	appUiStore.showToast({
		color: 'error',
		icon: ICONS.ERROR_OUTLINE,
		description,
	});
};

export const failedModal = (description: string, title?: string) => {
	const appUiStore = useAppUiStore();
	appUiStore.addModal({
		color: 'error',
		icon: ICONS.ERROR_OUTLINE,
		description,
		title,
	});
};
