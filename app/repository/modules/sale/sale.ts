import type { BaseODataReq } from '~/repository/base/base.req';
import HttpFactory from '../../factory';
import MerchantRoutes from '../../routes.client';
import type { GetSaleResp } from './models/response/get-sale.resp';
import type { GetSalesResp } from './models/response/get-sales.resp';
import type { UpdateSaleStatusResp } from './models/response/update-sale.resp';
import type { OrderStatus } from 'yeppi-common';

class SaleModule extends HttpFactory {
	private readonly RESOURCE = MerchantRoutes.Sales;

	/**
	 * Fetches all sales
	 * @returns
	 */
	async getBills(query: BaseODataReq): Promise<GetSalesResp> {
		return await this.call<GetSalesResp>({
			method: 'GET',
			url: `${this.RESOURCE.Many()}`,
			query,
		});
	}

	/**
	 * Exports bills as CSV
	 * @returns
	 */
	async exportBills(query: BaseODataReq): Promise<Blob> {
		return await this.call<Blob>({
			method: 'POST',
			url: `${this.RESOURCE.Export()}`,
			query,
			fetchOptions: {
				responseType: 'blob', // Tell the HTTP client to expect a blob response
			},
		});
	}

	/**
	 * Fetches sale by bill no
	 * @returns
	 */
	async getBillDetailsByOrderNo(order_no: string): Promise<GetSaleResp> {
		return await this.call<GetSaleResp>({
			method: 'GET',
			url: `${this.RESOURCE.Single(encodeURIComponent(order_no))}`,
		});
	}

	/**
	 * Updates order status
	 * @returns
	 */
	async updateStatus(order_no: string, customer_no: string, status: OrderStatus): Promise<UpdateSaleStatusResp> {
		return await this.call<UpdateSaleStatusResp>({
			method: 'PATCH',
			url: `${this.RESOURCE.UpdateOrderStatus(encodeURIComponent(order_no))}`,
			body: { customer_no, status },
		});
	}

	/**
	 * Resends the customer email matching the sale's current status.
	 * @returns
	 */
	async resendCurrentStatusEmail(order_no: string): Promise<UpdateSaleStatusResp> {
		return await this.call<UpdateSaleStatusResp>({
			method: 'POST',
			url: `${this.RESOURCE.ResendEmail(encodeURIComponent(order_no))}`,
		});
	}
}

export default SaleModule;
