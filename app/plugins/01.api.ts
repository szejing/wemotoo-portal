import {
	AuthModule,
	ProductCategoryModule,
	ProductTagModule,
	CurrencyModule,
	CrmUserModule,
	ImageModule,
	ProductModule,
	ProductVariationModule,
	ProductTypeModule,
	SettingModule,
	OrderModule,
	SummOrderModule,
	ProductVariantModule,
	PaymentTypeGroupModule,
	PaymentMethodModule,
	CountryModule,
	SaleSummaryModule,
	SaleModule,
	CustomerModule,
	ProductBrandModule,
	AppointmentModule,
	OutletModule,
	TaxGroupModule,
	TaxModule,
	TaxRuleModule,
	MerchantInfoModule,
	AffiliateModule,
	DiscountModule,
	VoucherModule,
	FulfillmentModule,
	ShipmentModule,
	CourierModule,
	ShippingMethodModule,
	ShippingZoneModule,
	ReasonModule,
	NotificationModule,
	StaffDepartmentModule,
} from '../repository/modules';

interface IApiInstance {
	product: ProductModule;
	tag: ProductTagModule;
	category: ProductCategoryModule;
	productVariation: ProductVariationModule;
	auth: AuthModule;
	currency: CurrencyModule;
	crmUser: CrmUserModule;
	image: ImageModule;
	setting: SettingModule;
	merchantInfo: MerchantInfoModule;
	productType: ProductTypeModule;
	summOrder: SummOrderModule;
	summSales: SaleSummaryModule;
	order: OrderModule;
	productVariant: ProductVariantModule;
	paymentTypeGroup: PaymentTypeGroupModule;
	paymentMethod: PaymentMethodModule;
	country: CountryModule;
	sale: SaleModule;
	customer: CustomerModule;
	brand: ProductBrandModule;
	appointment: AppointmentModule;
	taxRule: TaxRuleModule;
	tax: TaxModule;
	taxGroup: TaxGroupModule;
	outlet: OutletModule;
	affiliate: AffiliateModule;
	discount: DiscountModule;
	voucher: VoucherModule;
	fulfillment: FulfillmentModule;
	shipment: ShipmentModule;
	courier: CourierModule;
	shippingMethod: ShippingMethodModule;
	shippingZone: ShippingZoneModule;
	reason: ReasonModule;
	notification: NotificationModule;
	staffDepartment: StaffDepartmentModule;
}

export default defineNuxtPlugin((_) => {
	// const config = useRuntimeConfig();
	// const NUXT_BASE_URL_PROXY_SERVER: string = config.public.apiBaseUrl;

	// const apiFetcher = $fetch.create({
	// baseURL: NUXT_BASE_URL_PROXY_SERVER,
	// onRequest({ request, response }) {
	// 	console.log('Request:', request);
	// 	console.log('Response:', response);
	// },
	// });

	const authModule = new AuthModule();
	const currencyModule = new CurrencyModule();
	const productModule = new ProductModule();
	const tagModule = new ProductTagModule();
	const categoryModule = new ProductCategoryModule();
	const productVariationModule = new ProductVariationModule();
	const imageModule = new ImageModule();
	const settingModule = new SettingModule();
	const merchantInfoModule = new MerchantInfoModule();
	const productTypeModule = new ProductTypeModule();
	const summOrderModule = new SummOrderModule();
	const summSalesModule = new SaleSummaryModule();
	const orderModule = new OrderModule();
	const productVariantModule = new ProductVariantModule();
	const paymentTypeGroupModule = new PaymentTypeGroupModule();
	const paymentMethodModule = new PaymentMethodModule();
	const countryModule = new CountryModule();
	const crmUserModule = new CrmUserModule();
	const saleModule = new SaleModule();
	const customerModule = new CustomerModule();
	const brandModule = new ProductBrandModule();
	const appointmentModule = new AppointmentModule();
	const taxRuleModule = new TaxRuleModule();
	const taxModule = new TaxModule();
	const taxGroupModule = new TaxGroupModule();
	const outletModule = new OutletModule();
	const affiliateModule = new AffiliateModule();
	const discountModule = new DiscountModule();
	const voucherModule = new VoucherModule();
	const fulfillmentModule = new FulfillmentModule();
	const shipmentModule = new ShipmentModule();
	const courierModule = new CourierModule();
	const shippingMethodModule = new ShippingMethodModule();
	const shippingZoneModule = new ShippingZoneModule();
	const reasonModule = new ReasonModule();
	const notificationModule = new NotificationModule();
	const staffDepartmentModule = new StaffDepartmentModule();

	const modules: IApiInstance = {
		auth: authModule,
		currency: currencyModule,
		product: productModule,
		tag: tagModule,
		category: categoryModule,
		productVariation: productVariationModule,
		image: imageModule,
		setting: settingModule,
		merchantInfo: merchantInfoModule,
		productType: productTypeModule,
		summOrder: summOrderModule,
		summSales: summSalesModule,
		order: orderModule,
		productVariant: productVariantModule,
		paymentTypeGroup: paymentTypeGroupModule,
		paymentMethod: paymentMethodModule,
		country: countryModule,
		crmUser: crmUserModule,
		sale: saleModule,
		customer: customerModule,
		brand: brandModule,
		appointment: appointmentModule,
		taxRule: taxRuleModule,
		tax: taxModule,
		taxGroup: taxGroupModule,
		outlet: outletModule,
		affiliate: affiliateModule,
		discount: discountModule,
		voucher: voucherModule,
		fulfillment: fulfillmentModule,
		shipment: shipmentModule,
		courier: courierModule,
		shippingMethod: shippingMethodModule,
		shippingZone: shippingZoneModule,
		reason: reasonModule,
		notification: notificationModule,
		staffDepartment: staffDepartmentModule,
	};

	return {
		provide: {
			api: modules,
		},
	};
});
