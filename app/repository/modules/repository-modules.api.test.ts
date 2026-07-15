import { beforeEach, describe, expect, it } from 'bun:test';
import MerchantRoutes from '~/repository/routes.client';
import { removeNullValues } from '~/utils/utils';
import {
	changePasswordPayload,
	createAffiliatePayload,
	createAffiliateTierPayload,
	createAppointmentPayload,
	createCrmUserPayload,
	deleteAffiliateTierPayload,
	fullODataQuery,
	loginPayload,
	passwordResetPayload,
	patchAffiliateTierPayload,
	paymentMethodPatchPayload,
	resetPasswordPayload,
	updateAppointmentPayload,
	updateCrmUserPayload,
	updateMerchantInfoPayload,
	updateSettingsPayload,
} from '../../../test/repository-model-fixtures';
import { fetchLog, lastFetch, resetFetchMock } from '../../../test/repository-test-setup';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { CrmUserReq } from './crm-user/request/crm-user.req';
import { IMAGE_FORMAT_ERROR_MESSAGE } from './image/image';

import AffiliateModule from './affiliate/affiliate';
import ActivityLogModule from './activity-log/activity-log';
import AppointmentModule from './appointment/appointment';
import AuthModule from './auth/auth';
import CountryModule from './country/country';
import CrmUserModule from './crm-user/crm-user';
import CurrencyModule from './currency/currency';
import CustomerModule, { CUSTOMER_IMPORT_FORMAT_ERROR_MESSAGE } from './customer/customer';
import ImageModule from './image/image';
import MerchantInfoModule from './merchant-info/merchant-info';
import NotificationModule from './notification/notification';
import OrderModule from './order/order';
import OutletModule from './outlets/outlet';
import PaymentMethodModule from './payment-method/payment-method';
import PaymentTypeGroupModule from './payment-type-group/payment-type-group';
import ProductBrandModule from './product-brand/product-brand';
import ProductCategoryModule from './product-category/product-category';
import ProductModule, { PRODUCT_IMPORT_FORMAT_ERROR_MESSAGE } from './product/product';
import ProductTagModule from './product-tag/product-tag';
import ProductTypeModule from './product-type/product-type';
import ProductVariantModule from './product-variant/product-variant';
import ProductVariationModule from './product-variation/product-variation';
import SaleModule from './sale/sale';
import SettingModule from './setting/setting';
import SaleSummaryModule from './summ-sale/summ-sale';
import OrderSummaryModule from './summ-order/summ-order';
import TaxGroupModule from './tax-groups/tax-group';
import TaxRuleModule from './tax-rules/tax-rule';
import TaxModule from './taxes/tax';
import VoucherModule from './voucher/voucher';
import type { CreateVoucherReq } from './voucher/models/request/create-voucher.req';
import { DiscountType, OrderResendEmailAction } from 'yeppi-common';

const odata: BaseODataReq = { $top: 10 };
const dashboardRange = { start_date: '2025-01-01', end_date: '2025-01-31' };

beforeEach(() => {
	resetFetchMock();
});

describe('AuthModule', () => {
	const auth = new AuthModule();

	it('login', async () => {
		await auth.login(loginPayload);
		expect(lastFetch().url).toBe(MerchantRoutes.Auth.Login());
		expect(lastFetch().opts.method).toBe('POST');
		expect(lastFetch().opts.body).toEqual(loginPayload);
	});

	it('heartbeat', async () => {
		await auth.heartbeat();
		expect(lastFetch().url).toBe('/merchant/heartbeat');
		expect(lastFetch().opts.method).toBe('GET');
	});

	it('passwordReset', async () => {
		await auth.passwordReset(passwordResetPayload);
		expect(lastFetch().url).toBe(MerchantRoutes.Auth.PasswordReset());
		expect(lastFetch().opts.method).toBe('POST');
		expect(lastFetch().opts.body).toEqual(passwordResetPayload);
	});

	it('validatePasswordResetToken', async () => {
		await auth.validatePasswordResetToken('tok');
		expect(lastFetch().url).toBe(MerchantRoutes.Auth.PasswordResetValidate());
		expect(lastFetch().opts.body).toEqual({ token: 'tok' });
	});

	it('confirmResetPassword', async () => {
		await auth.confirmResetPassword({ token: 't', password: 'p' });
		expect(lastFetch().url).toBe(MerchantRoutes.Auth.PasswordResetConfirm());
	});

	it('verify', async () => {
		await auth.verify({ merchant_id: 'M00001', authorization: 'Bearer token' });
		expect(lastFetch().url).toBe(MerchantRoutes.Auth.Verify());
		expect(lastFetch().opts.method).toBe('POST');
		expect(lastFetch().opts.body).toEqual({ merchant_id: 'M00001' });
		expect(lastFetch().opts.headers?.Authorization).toBe('Bearer token');
	});

	it('refreshToken', async () => {
		await auth.refreshToken();
		expect(lastFetch().url).toBe(MerchantRoutes.Auth.Refresh());
	});

	it('logout', async () => {
		await auth.logout();
		expect(lastFetch().url).toBe(MerchantRoutes.Auth.Logout());
	});
});

describe('CrmUserModule', () => {
	const mod = new CrmUserModule();

	it('getMany', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.CrmUsers.Many());
		expect(lastFetch().opts.query).toEqual(odata);
	});

	it('getSingle', async () => {
		await mod.getSingle('id-1');
		expect(lastFetch().url).toBe(MerchantRoutes.CrmUsers.Single('id-1'));
	});

	it('create', async () => {
		await mod.create(createCrmUserPayload);
		expect(lastFetch().opts.method).toBe('POST');
		expect(lastFetch().url).toBe(MerchantRoutes.CrmUsers.Create());
		expect(lastFetch().opts.body).toBe(createCrmUserPayload);
	});

	it('update', async () => {
		await mod.update('u1', updateCrmUserPayload);
		expect(lastFetch().url).toBe(MerchantRoutes.CrmUsers.Update('u1'));
		expect(lastFetch().opts.method).toBe('PATCH');
		expect(lastFetch().opts.body).toBe(updateCrmUserPayload);
	});

	it('updatePassword', async () => {
		await mod.updatePassword('u1', changePasswordPayload);
		expect(lastFetch().url).toBe(MerchantRoutes.CrmUsers.UpdatePassword('u1'));
		expect(lastFetch().opts.body).toBe(changePasswordPayload);
	});

	it('resetPassword', async () => {
		await mod.resetPassword('u1', resetPasswordPayload);
		expect(lastFetch().url).toBe(MerchantRoutes.CrmUsers.ResetPassword('u1'));
		expect(lastFetch().opts.body).toBe(resetPasswordPayload);
	});

	it('delete', async () => {
		const u = { id: 'u1' } as CrmUserReq;
		await mod.delete(u);
		expect(lastFetch().opts.method).toBe('DELETE');
		expect(lastFetch().url).toBe(MerchantRoutes.CrmUsers.Delete('u1'));
	});
});

describe('ActivityLogModule', () => {
	const mod = new ActivityLogModule();

	it('getMany', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.ActivityLogs.Many());
		expect(lastFetch().opts.method).toBe('GET');
		expect(lastFetch().opts.query).toEqual(odata);
	});
});

describe('OrderModule', () => {
	const mod = new OrderModule();

	it('getOrders', async () => {
		await mod.getOrders(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Orders.Many());
		expect(lastFetch().opts.query).toEqual(odata);
	});

	it('getOrders forwards full OData query (all BaseODataReq fields)', async () => {
		await mod.getOrders(fullODataQuery);
		expect(lastFetch().opts.query).toEqual(fullODataQuery);
	});

	it('getOrderByOrderNo encodes order number in path', async () => {
		await mod.getOrderByOrderNo('ORD/1');
		expect(lastFetch().url).toBe(MerchantRoutes.Orders.Single(encodeURIComponent('ORD/1')));
	});

	it('updateOrderStatus', async () => {
		await mod.updateStatus('O1', 'C1', 'paid');
		expect(lastFetch().url).toBe(MerchantRoutes.Orders.UpdateOrderStatus(encodeURIComponent('O1')));
		expect(lastFetch().opts.body).toEqual({
			customer_no: 'C1',
			status: 'paid',
		});
	});

	it('updateOrder', async () => {
		await mod.updateOrder('O1', 'C1', 'completed');
		expect(lastFetch().url).toBe(MerchantRoutes.Orders.Update(encodeURIComponent('O1')));
		expect(lastFetch().opts.body).toEqual({
			customer_no: 'C1',
			payment_status: 'completed',
		});
	});

	it('updateCustomer', async () => {
		const customer = { customer_no: 'C1', name: 'Jane' } as any;
		await mod.updateCustomer('O1', customer);
		expect(lastFetch().url).toBe(MerchantRoutes.Orders.UpdateOrderCustomer(encodeURIComponent('O1')));
		expect(lastFetch().opts.body).toEqual({ customer_no: 'C1', customer });
	});

	it('updatePayments', async () => {
		const payments = [{ code: 'cash' }] as any;
		await mod.updatePayments('O1', 'C1', payments);
		expect(lastFetch().url).toBe(MerchantRoutes.Orders.UpdateOrderPayments(encodeURIComponent('O1')));
		expect(lastFetch().opts.body).toEqual({ customer_no: 'C1', payments });
	});

	it('updateItems', async () => {
		const items = [{ item_line: 1 }] as any;
		await mod.updateItems('O1', 'C1', items);
		expect(lastFetch().url).toBe(MerchantRoutes.Orders.UpdateOrderItems(encodeURIComponent('O1')));
		expect(lastFetch().opts.body).toEqual({ customer_no: 'C1', items });
	});

	it('exportOrders uses blob response', async () => {
		await mod.exportOrders(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Orders.Export());
		expect(lastFetch().opts.method).toBe('POST');
		expect(lastFetch().opts.responseType).toBe('blob');
	});

	it('resendCurrentStatusEmail posts to encoded order resend route', async () => {
		await mod.resendCurrentStatusEmail('ORD/1', OrderResendEmailAction.SHIPPED);
		expect(lastFetch().url).toBe(MerchantRoutes.Orders.ResendEmail(encodeURIComponent('ORD/1')));
		expect(lastFetch().opts.method).toBe('POST');
		expect(lastFetch().opts.body).toEqual({ action: OrderResendEmailAction.SHIPPED });
	});
});

describe('OrderSummaryModule (summ-order)', () => {
	const mod = new OrderSummaryModule();

	it('getDashboardOrderSummary', async () => {
		await mod.getDashboardOrderSummary(dashboardRange);
		expect(lastFetch().url).toBe(MerchantRoutes.SummOrders.Dashboard());
		expect(lastFetch().opts.query).toEqual(dashboardRange);
	});

	it('getSummOrders', async () => {
		await mod.getSummOrders(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.SummOrders.Orders());
	});

	it('exportSummOrders', async () => {
		await mod.exportSummOrders(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.SummOrders.Export());
		expect(lastFetch().opts.responseType).toBe('blob');
	});

	it('getSummOrderItems', async () => {
		await mod.getSummOrderItems(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.SummOrders.Items());
	});

	it('exportSummOrderItems', async () => {
		await mod.exportSummOrderItems(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.SummOrders.ExportItems());
		expect(lastFetch().opts.responseType).toBe('blob');
	});

	it('getSummOrderCustomers', async () => {
		await mod.getSummOrderCustomers(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.SummOrders.Customers());
	});

	it('exportSummOrderCustomers', async () => {
		await mod.exportSummOrderCustomers(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.SummOrders.ExportCustomers());
		expect(lastFetch().opts.responseType).toBe('blob');
	});
});

describe('SaleSummaryModule (summ-sale)', () => {
	const mod = new SaleSummaryModule();

	it('getDashboardSalesSummary', async () => {
		await mod.getDashboardSalesSummary(dashboardRange);
		expect(lastFetch().url).toBe(MerchantRoutes.SummSales.Dashboard());
	});

	it('getSummSales', async () => {
		await mod.getSummSales(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.SummSales.Sales());
	});

	it('exportSalesSummary', async () => {
		await mod.exportSalesSummary(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.SummSales.Export());
		expect(lastFetch().opts.responseType).toBe('blob');
	});

	it('getSummSalesItems', async () => {
		await mod.getSummSalesItems(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.SummSales.Items());
	});

	it('exportSalesItems', async () => {
		await mod.exportSalesItems(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.SummSales.ExportItems());
	});

	it('getSummSalesCustomers', async () => {
		await mod.getSummSalesCustomers(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.SummSales.Customers());
	});

	it('exportSalesCustomers', async () => {
		await mod.exportSalesCustomers(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.SummSales.ExportCustomers());
	});

	it('getSummSalesPayments', async () => {
		await mod.getSummSalesPayments(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.SummSales.Payments());
	});

	it('exportSalesPayments', async () => {
		await mod.exportSalesPayments(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.SummSales.ExportPayments());
		expect(lastFetch().opts.responseType).toBe('blob');
	});
});

describe('SaleModule', () => {
	const mod = new SaleModule();

	it('getBills', async () => {
		await mod.getBills(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Sales.Many());
	});

	it('exportBills', async () => {
		await mod.exportBills(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Sales.Export());
		expect(lastFetch().opts.responseType).toBe('blob');
	});

	it('getBillDetailsByOrderNo', async () => {
		await mod.getBillDetailsByOrderNo('B/1');
		expect(lastFetch().url).toBe(MerchantRoutes.Sales.Single(encodeURIComponent('B/1')));
	});

	it('resendCurrentStatusEmail posts to encoded sale resend route', async () => {
		await mod.resendCurrentStatusEmail('B/1', OrderResendEmailAction.SHIPPED);
		expect(lastFetch().url).toBe(MerchantRoutes.Sales.ResendEmail(encodeURIComponent('B/1')));
		expect(lastFetch().opts.method).toBe('POST');
		expect(lastFetch().opts.body).toEqual({ action: OrderResendEmailAction.SHIPPED });
	});
});

describe('SettingModule', () => {
	const mod = new SettingModule();

	it('getMany', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Settings.Many());
	});

	it('saveMany', async () => {
		await mod.saveMany(updateSettingsPayload);
		expect(lastFetch().url).toBe(MerchantRoutes.Settings.SaveMany());
		expect(lastFetch().opts.method).toBe('POST');
		expect(lastFetch().opts.body).toBe(updateSettingsPayload);
	});
});

describe('ProductModule', () => {
	const mod = new ProductModule();

	it('getMany', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Products.Many());
	});

	it('getSingle', async () => {
		await mod.getSingle('P1');
		expect(lastFetch().url).toBe(MerchantRoutes.Products.Single('P1'));
	});

	it('create', async () => {
		const body = { code: 'P1' } as any;
		await mod.create(body);
		expect(lastFetch().url).toBe(MerchantRoutes.Products.Create());
	});

	it('update', async () => {
		await mod.update('P1', { name: 'X' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.Products.Update('P1'));
	});

	it('delete', async () => {
		await mod.delete({ code: 'P1' });
		expect(lastFetch().url).toBe(MerchantRoutes.Products.Delete('P1'));
	});

	it('deleteVariant', async () => {
		await mod.deleteVariant('P1', 'V1');
		expect(lastFetch().url).toBe(MerchantRoutes.Products.DeleteVariant('P1', 'V1'));
	});

	it('restore', async () => {
		await mod.restore({ code: 'P1' });
		expect(lastFetch().url).toBe(MerchantRoutes.Products.Restore('P1'));
	});

	it('importProducts sends allowed spreadsheet file as FormData', async () => {
		const file = new File(['code,name'], 'products.csv', { type: 'text/csv' });

		await mod.importProducts(file);

		expect(lastFetch().url).toBe(MerchantRoutes.Products.Import());
		expect(lastFetch().opts.method).toBe('POST');
		const fd = lastFetch().opts.body as FormData;
		expect(fd).toBeInstanceOf(FormData);
		const uploaded = fd.get('file') as File;
		expect(uploaded.name).toBe('products.csv');
		expect(fd.get('template_type')).toBe('wemotoo');
	});

	it('importProducts sends selected Sitegiant template type', async () => {
		const file = new File(['code,name'], 'products.xlsx', {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		});

		await mod.importProducts(file, 'sitegiant');

		const fd = lastFetch().opts.body as FormData;
		expect(fd.get('template_type')).toBe('sitegiant');
	});

	it('importProducts rejects unsupported file extensions before network call', async () => {
		const file = new File(['bad'], 'products.txt', { type: 'text/plain' });

		await expect(mod.importProducts(file)).rejects.toThrow(PRODUCT_IMPORT_FORMAT_ERROR_MESSAGE);
		expect(fetchLog).toHaveLength(0);
	});

	it('downloadImportTemplate uses blob response', async () => {
		await mod.downloadImportTemplate();

		expect(lastFetch().url).toBe(MerchantRoutes.Products.ImportTemplate());
		expect(lastFetch().opts.method).toBe('GET');
		expect(lastFetch().opts.responseType).toBe('blob');
	});
});

describe('ProductTypeModule', () => {
	const mod = new ProductTypeModule();

	it('CRUD-style routes', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductTypes.Many());
		await mod.getSingle(3);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductTypes.Single(3));
		await mod.create({ name: 't' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductTypes.Create());
		await mod.update(3, { name: 'u' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductTypes.Update(3));
		await mod.delete({ id: 3 } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductTypes.Delete(3));
		await mod.restore({ id: 3 } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductTypes.Restore(3));
	});
});

describe('ProductTagModule', () => {
	const mod = new ProductTagModule();

	it('CRUD-style routes', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductTags.Many());
		await mod.getSingle(2);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductTags.Single(2));
		await mod.create({ name: 't' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductTags.Create());
		await mod.update(2, { name: 'u' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductTags.Update(2));
		await mod.delete({ id: 2 } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductTags.Delete(2));
		await mod.restore({ id: 2 } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductTags.Restore(2));
	});
});

describe('ProductCategoryModule', () => {
	const mod = new ProductCategoryModule();

	it('routes', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductCategories.Many());
		await mod.getSingle('CAT');
		expect(lastFetch().url).toBe(MerchantRoutes.ProductCategories.Single('CAT'));
		await mod.create({ code: 'CAT' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductCategories.Create());
		await mod.update('CAT', { name: 'x' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductCategories.Update('CAT'));
		await mod.delete({ code: 'CAT' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductCategories.Delete('CAT'));
		await mod.restore({ code: 'CAT' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductCategories.Restore('CAT'));
	});
});

describe('ProductVariationModule', () => {
	const mod = new ProductVariationModule();

	it('routes', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.ProdVariations.Many());
		await mod.getSingle(9);
		expect(lastFetch().url).toBe(MerchantRoutes.ProdVariations.Single(9));
		await mod.create({ name: 'o' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProdVariations.Create());
		await mod.update(9, { name: 'u' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProdVariations.Update(9));
		await mod.delete({ id: 9 } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProdVariations.Delete(9));
		await mod.restore({ id: 9 } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProdVariations.Restore(9));
	});
});

describe('ProductVariantModule', () => {
	const mod = new ProductVariantModule();

	it('getVariantsByProdCode', async () => {
		await mod.getVariantsByProdCode('PROD');
		expect(lastFetch().url).toBe(MerchantRoutes.ProdVariants.SingleByProdCode('PROD'));
	});
});

describe('ProductBrandModule', () => {
	const mod = new ProductBrandModule();

	it('routes', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductBrands.Many());
		await mod.getSingle('BR');
		expect(lastFetch().url).toBe(MerchantRoutes.ProductBrands.Single('BR'));
		await mod.create({ code: 'BR' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductBrands.Create());
		const payload = { name: 'x', logo_url: null } as any;
		await mod.update('BR', payload);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductBrands.Update('BR'));
		expect(lastFetch().opts.body).toEqual(removeNullValues(payload));
		await mod.delete({ code: 'BR' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductBrands.Delete('BR'));
		await mod.restore({ code: 'BR' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.ProductBrands.Restore('BR'));
	});
});

describe('CustomerModule', () => {
	const mod = new CustomerModule();

	it('getMany', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Customers.Many());
	});

	it('getSingle', async () => {
		await mod.getSingle('CUST');
		expect(lastFetch().url).toBe(MerchantRoutes.Customers.Single('CUST'));
	});

	it('getOrders', async () => {
		await mod.getOrders('CUST');
		expect(lastFetch().url).toBe(MerchantRoutes.Customers.Orders('CUST'));
	});

	it('updateInsights add', async () => {
		await mod.updateInsights('CUST', {
			merchant_id: 'M1',
			action: 'add',
			insight: {
				key: 'polite' as any,
				category: 'communication' as any,
				note: 'Very courteous',
			},
		});
		expect(lastFetch().url).toBe(MerchantRoutes.Customers.UpdateInsights('CUST'));
		expect(lastFetch().opts.method).toBe('PATCH');
		expect(lastFetch().opts.body).toEqual({
			merchant_id: 'M1',
			action: 'add',
			insight: {
				key: 'polite',
				category: 'communication',
				note: 'Very courteous',
			},
		});
	});

	it('updateInsights remove', async () => {
		await mod.updateInsights('CUST', {
			merchant_id: 'M1',
			action: 'remove',
			insight_id: 'insight-1',
		});
		expect(lastFetch().url).toBe(MerchantRoutes.Customers.UpdateInsights('CUST'));
		expect(lastFetch().opts.method).toBe('PATCH');
		expect(lastFetch().opts.body).toEqual({
			merchant_id: 'M1',
			action: 'remove',
			insight_id: 'insight-1',
		});
	});

	it('importCustomers sends allowed spreadsheet file as FormData', async () => {
		const file = new File(['name,email_address'], 'customers.csv', {
			type: 'text/csv',
		});

		await mod.importCustomers(file);

		expect(lastFetch().url).toBe(MerchantRoutes.Customers.Import());
		expect(lastFetch().opts.method).toBe('POST');
		const fd = lastFetch().opts.body as FormData;
		expect(fd).toBeInstanceOf(FormData);
		const uploaded = fd.get('file') as File;
		expect(uploaded.name).toBe('customers.csv');
	});

	it('importCustomers rejects unsupported file extensions before network call', async () => {
		const file = new File(['bad'], 'customers.txt', { type: 'text/plain' });

		await expect(mod.importCustomers(file)).rejects.toThrow(CUSTOMER_IMPORT_FORMAT_ERROR_MESSAGE);
		expect(fetchLog).toHaveLength(0);
	});
});

describe('CurrencyModule', () => {
	it('getCurrencies', async () => {
		const mod = new CurrencyModule();
		await mod.getCurrencies(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Currencies.Many());
		expect(lastFetch().opts.query).toEqual(odata);
	});
});

describe('NotificationModule', () => {
	const mod = new NotificationModule();

	it('getMany forwards OData query', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Notifications.Many());
		expect(lastFetch().opts.method).toBe('GET');
		expect(lastFetch().opts.query).toEqual(odata);
	});
});

describe('CountryModule', () => {
	it('getCountries', async () => {
		const mod = new CountryModule();
		await mod.getCountries(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Countries.Many());
	});
});

describe('PaymentTypeGroupModule', () => {
	it('getMany', async () => {
		const mod = new PaymentTypeGroupModule();
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.PaymentTypeGroups.Many());
	});
});

describe('PaymentMethodModule', () => {
	const mod = new PaymentMethodModule();

	it('getMany', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.PaymentMethods.Many());
	});

	it('update', async () => {
		await mod.update('pm1', paymentMethodPatchPayload);
		expect(lastFetch().url).toBe(MerchantRoutes.PaymentMethods.Update('pm1'));
		expect(lastFetch().opts.method).toBe('PATCH');
		expect(lastFetch().opts.body).toBe(paymentMethodPatchPayload);
	});

	it('updateStatus delegates to update', async () => {
		await mod.updateStatus({ code: 'pm1', is_active: false });
		expect(lastFetch().url).toBe(MerchantRoutes.PaymentMethods.Update('pm1'));
		expect(lastFetch().opts.body).toEqual({ is_active: false });
	});
});

describe('MerchantInfoModule', () => {
	const mod = new MerchantInfoModule();

	it('getMany', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.MerchantInfo.Many());
	});

	it('saveMany', async () => {
		await mod.saveMany(updateMerchantInfoPayload);
		expect(lastFetch().url).toBe(MerchantRoutes.MerchantInfo.SaveMany());
		expect(lastFetch().opts.body).toBe(updateMerchantInfoPayload);
	});
});

describe('OutletModule', () => {
	const mod = new OutletModule();

	it('routes', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Outlets.Many());
		await mod.getSingle('O1');
		expect(lastFetch().url).toBe(MerchantRoutes.Outlets.Single('O1'));
		await mod.create({ code: 'O1' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.Outlets.Create());
		await mod.update('O1', { name: 'x' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.Outlets.Update('O1'));
		await mod.delete({ code: 'O1' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.Outlets.Delete('O1'));
		await mod.restore({ code: 'O1' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.Outlets.Restore('O1'));
	});
});

describe('TaxModule', () => {
	const mod = new TaxModule();

	it('routes', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Taxes.Many());
		await mod.getSingle('T1');
		expect(lastFetch().url).toBe(MerchantRoutes.Taxes.Single('T1'));
		await mod.create({ code: 'T1' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.Taxes.Create());
		await mod.update('T1', { name: 'x' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.Taxes.Update('T1'));
		await mod.delete({ code: 'T1' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.Taxes.Delete('T1'));
		await mod.restore({ code: 'T1' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.Taxes.Restore('T1'));
	});
});

describe('TaxGroupModule', () => {
	const mod = new TaxGroupModule();

	it('routes', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.TaxGroups.Many());
		await mod.getSingle('G1');
		expect(lastFetch().url).toBe(MerchantRoutes.TaxGroups.Single('G1'));
		await mod.create({ code: 'G1' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.TaxGroups.Create());
		await mod.update('G1', { name: 'x' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.TaxGroups.Update('G1'));
		await mod.delete({ code: 'G1' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.TaxGroups.Delete('G1'));
		await mod.restore({ code: 'G1' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.TaxGroups.Restore('G1'));
	});
});

describe('TaxRuleModule', () => {
	const mod = new TaxRuleModule();

	it('routes', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.TaxRules.Many());
		await mod.getSingle('R1');
		expect(lastFetch().url).toBe(MerchantRoutes.TaxRules.Single('R1'));
		await mod.create({ code: 'R1' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.TaxRules.Create());
		await mod.update('R1', { name: 'x' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.TaxRules.Update('R1'));
		await mod.delete({ code: 'R1' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.TaxRules.Delete('R1'));
		await mod.restore({ code: 'R1' } as any);
		expect(lastFetch().url).toBe(MerchantRoutes.TaxRules.Restore('R1'));
	});
});

describe('AppointmentModule', () => {
	const mod = new AppointmentModule();

	it('routes', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Appointments.Many());
		await mod.getSingle('APT');
		expect(lastFetch().url).toBe(MerchantRoutes.Appointments.Single('APT'));
		await mod.create(createAppointmentPayload);
		expect(lastFetch().url).toBe(MerchantRoutes.Appointments.Create());
		expect(lastFetch().opts.body).toBe(createAppointmentPayload);
		await mod.update('APT', updateAppointmentPayload);
		expect(lastFetch().url).toBe(MerchantRoutes.Appointments.Update('APT'));
		expect(lastFetch().opts.body).toBe(updateAppointmentPayload);
		await mod.delete('APT');
		expect(lastFetch().url).toBe(MerchantRoutes.Appointments.Delete('APT'));
		await mod.restore('APT');
		expect(lastFetch().url).toBe(MerchantRoutes.Appointments.Restore('APT'));
		await mod.getByCustomer('C1', odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Appointments.GetByCustomer('C1'));
		expect(lastFetch().opts.query).toEqual(odata);
	});
});

describe('AffiliateModule', () => {
	const mod = new AffiliateModule();

	it('routes', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Affiliates.Many());
		await mod.getBySlug('slug');
		expect(lastFetch().url).toBe(MerchantRoutes.Affiliates.BySlug('slug'));
		await mod.getById('a1');
		expect(lastFetch().url).toBe(MerchantRoutes.Affiliates.Single('a1'));
		await mod.create(createAffiliatePayload);
		expect(lastFetch().url).toBe(MerchantRoutes.Affiliates.Create());
		expect(lastFetch().opts.body).toBe(createAffiliatePayload);
		await mod.getTiers();
		expect(lastFetch().url).toBe(MerchantRoutes.Affiliates.Tiers());
		await mod.createTier(createAffiliateTierPayload);
		expect(lastFetch().url).toBe(MerchantRoutes.Affiliates.TierCreate());
		expect(lastFetch().opts.body).toBe(createAffiliateTierPayload);
		await mod.updateTier(1, patchAffiliateTierPayload);
		expect(lastFetch().url).toBe(MerchantRoutes.Affiliates.TierUpdate(1));
		expect(lastFetch().opts.body).toBe(patchAffiliateTierPayload);
		await mod.deleteTier(2);
		expect(lastFetch().url).toBe(MerchantRoutes.Affiliates.TierDelete(2));
		expect(lastFetch().opts.body).toEqual({});
		await mod.deleteTier(3, deleteAffiliateTierPayload);
		expect(lastFetch().opts.body).toBe(deleteAffiliateTierPayload);
		await mod.getMyReport({ user: { id: 'u' } });
		expect(lastFetch().url).toBe(MerchantRoutes.Affiliates.MyReport());
		expect(lastFetch().opts.query).toEqual({ user: { id: 'u' } });
	});
});

describe('VoucherModule', () => {
	const mod = new VoucherModule();
	const createPayload: CreateVoucherReq = {
		code: 'SUMMER10',
		description: 'Summer voucher',
	};

	it('routes', async () => {
		await mod.getMany(odata);
		expect(lastFetch().url).toBe(MerchantRoutes.Vouchers.Many());
		expect(lastFetch().opts.query).toEqual(odata);
		await mod.getSingle('V1');
		expect(lastFetch().url).toBe(MerchantRoutes.Vouchers.Single('V1'));
		await mod.create(createPayload);
		expect(lastFetch().opts.method).toBe('POST');
		expect(lastFetch().url).toBe(MerchantRoutes.Vouchers.Create());
		expect(lastFetch().opts.body).toEqual(createPayload);

		const bundledPayload: CreateVoucherReq = {
			...createPayload,
			discount: {
				description: 'Bundle discount',
				is_disabled: false,
				disc_type: DiscountType.PERCENTAGE,
				disc_value: 10,
			},
		};
		await mod.create(bundledPayload);
		expect(lastFetch().opts.body).toEqual(bundledPayload);
		await mod.update('V1', { description: 'Updated' });
		expect(lastFetch().url).toBe(MerchantRoutes.Vouchers.Update('V1'));
		expect(lastFetch().opts.method).toBe('PATCH');
		expect(lastFetch().opts.body).toEqual({ description: 'Updated' });
		await mod.remove({ code: 'V1' });
		expect(lastFetch().url).toBe(MerchantRoutes.Vouchers.Delete('V1'));
		expect(lastFetch().opts.method).toBe('DELETE');
	});
});

describe('ImageModule', () => {
	const mod = new ImageModule();
	const jpeg = new File([new Uint8Array([0xff, 0xd8])], 'p.jpg', {
		type: 'image/jpeg',
	});
	const jpeg2 = new File([new Uint8Array([0xff, 0xd8])], 'q.jpg', {
		type: 'image/jpeg',
	});

	it('upload sends FormData with file and dir fields', async () => {
		await mod.upload(jpeg, 'products', 'product-thumbnail', 2);
		expect(lastFetch().url).toBe(MerchantRoutes.Images.Upload());
		const fd = lastFetch().opts.body as FormData;
		expect(fd).toBeInstanceOf(FormData);
		expect(fd.get('dir')).toBe('products');
		expect(fd.get('nameType')).toBe('product-thumbnail');
		expect(fd.get('nameIndex')).toBe('2');
		const uploaded = fd.get('file') as File;
		expect(uploaded.name).toBe(jpeg.name);
		expect(uploaded.type).toBe(jpeg.type);
		expect(uploaded.size).toBe(jpeg.size);
	});

	it('uploadMultiple sends FormData with files[] and dir', async () => {
		await mod.uploadMultiple([jpeg, jpeg2], 'invoices', 'product-gallery');
		expect(lastFetch().url).toBe(MerchantRoutes.Images.UploadMultiple());
		const fd = lastFetch().opts.body as FormData;
		expect(fd).toBeInstanceOf(FormData);
		expect(fd.get('dir')).toBe('invoices');
		expect(fd.get('nameType')).toBe('product-gallery');
		const files = fd.getAll('files') as File[];
		expect(files).toHaveLength(2);
		expect(files[0]!.name).toBe(jpeg.name);
		expect(files[1]!.name).toBe(jpeg2.name);
	});

	it('allows HEIF sequence and WebP uploads before backend conversion', async () => {
		await mod.upload(new File(['x'], 'motion.heif', { type: 'image/heif-sequence' }), 'products');
		await mod.upload(new File(['x'], 'already.webp', { type: 'image/webp' }), 'products');

		expect(fetchLog).toHaveLength(2);
	});

	it('allows HEIC uploads by extension when the browser omits the mime type', async () => {
		await mod.upload(new File(['x'], 'camera.HEIC'), 'products');

		expect(fetchLog).toHaveLength(1);
	});

	it('rejects unsupported mime before calling the network', async () => {
		const bad = new File(['x'], 'x.txt', { type: 'text/plain' });
		await expect(mod.upload(bad, 'd')).rejects.toThrow(IMAGE_FORMAT_ERROR_MESSAGE);
		expect(fetchLog).toHaveLength(0);
	});
});
