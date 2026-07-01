import HttpFactory from '~/repository/factory';
import MerchantRoutes from '~/repository/routes.client';
import type { CustomerResp } from './models/response/customer.resp';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { BaseODataResp } from '~/repository/base/base.resp';
import type { Customer } from '~/utils/types/customer';
import type { OrderHistory } from '~/utils/types/order-history';
import type { UpdateCustomerInsightsReq } from './models/request/customer-insights.req';

const CUSTOMER_IMPORT_ALLOWED_EXTENSIONS = ['.csv', '.xlsx'] as const;

export const CUSTOMER_IMPORT_ACCEPT = '.csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const CUSTOMER_IMPORT_FORMAT_ERROR_MESSAGE = 'Unsupported customer import file format. Allowed: CSV, XLSX';

export type CustomerImportResp = {
	total: number;
	created: number;
	updated: number;
	failed: number;
	errors: Array<{
		row: number;
		customer_no?: string;
		email_address?: string;
		message: string;
	}>;
};

export function isAllowedCustomerImportFile(file: File): boolean {
	const filename = file.name.toLowerCase();
	return CUSTOMER_IMPORT_ALLOWED_EXTENSIONS.some((extension) => filename.endsWith(extension));
}

function assertAllowedCustomerImportFormat(file: File): void {
	if (!isAllowedCustomerImportFile(file)) {
		throw new Error(CUSTOMER_IMPORT_FORMAT_ERROR_MESSAGE);
	}
}

class CustomerModule extends HttpFactory {
	private RESOURCE = MerchantRoutes.Customers;

	async getMany(query: BaseODataReq): Promise<BaseODataResp<Customer>> {
		return await this.call<BaseODataResp<Customer>>({
			method: 'GET',
			url: `${this.RESOURCE.Many()}`,
			query,
		});
	}

	async getSingle(cust_no: string): Promise<CustomerResp> {
		return await this.call<CustomerResp>({
			method: 'GET',
			url: `${this.RESOURCE.Single(cust_no)}`,
		});
	}

	async getOrders(cust_no: string): Promise<BaseODataResp<OrderHistory>> {
		return await this.call<BaseODataResp<OrderHistory>>({
			method: 'GET',
			url: `${this.RESOURCE.Orders(cust_no)}`,
		});
	}

	async updateInsights(cust_no: string, body: UpdateCustomerInsightsReq): Promise<CustomerResp> {
		return await this.call<CustomerResp>({
			method: 'PATCH',
			url: `${this.RESOURCE.UpdateInsights(cust_no)}`,
			body,
		});
	}

	async importCustomers(file: File): Promise<CustomerImportResp> {
		assertAllowedCustomerImportFormat(file);

		const formData = new FormData();
		formData.append('file', file);

		return await this.call<CustomerImportResp>({
			method: 'POST',
			url: `${this.RESOURCE.Import()}`,
			body: formData,
		});
	}

	async downloadImportTemplate(): Promise<Blob> {
		return await this.call<Blob>({
			method: 'GET',
			url: `${this.RESOURCE.ImportTemplate()}`,
			fetchOptions: {
				responseType: 'blob',
			},
		});
	}
}

export default CustomerModule;
