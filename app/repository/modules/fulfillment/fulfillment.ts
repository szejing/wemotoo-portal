import HttpFactory from '~/repository/factory';
import MerchantRoutes from '~/repository/routes.client';
import type { FulfillmentActionReq } from './models/request/fulfillment-action.req';
import type { UpdateFulfillmentReq } from './models/request/update-fulfillment.req';
import type { FulfillmentResp } from './models/response/fulfillment.resp';

class FulfillmentModule extends HttpFactory {
	private readonly RESOURCE = MerchantRoutes.Fulfillment;

	async create(order_no: string, body: FulfillmentActionReq): Promise<FulfillmentResp> {
		return await this.call<FulfillmentResp>({
			method: 'POST',
			url: this.RESOURCE.Create(encodeURIComponent(order_no)),
			body,
		});
	}

	async update(id: string, body: UpdateFulfillmentReq): Promise<FulfillmentResp> {
		return await this.call<FulfillmentResp>({
			method: 'PATCH',
			url: this.RESOURCE.Update(encodeURIComponent(id)),
			body,
		});
	}

	async markProcessing(id: string, body: FulfillmentActionReq): Promise<FulfillmentResp> {
		return await this.call<FulfillmentResp>({
			method: 'PATCH',
			url: this.RESOURCE.MarkProcessing(encodeURIComponent(id)),
			body,
		});
	}

	async markPacked(id: string, body: FulfillmentActionReq): Promise<FulfillmentResp> {
		return await this.call<FulfillmentResp>({
			method: 'PATCH',
			url: this.RESOURCE.MarkPacked(encodeURIComponent(id)),
			body,
		});
	}

	async markFulfilled(id: string, body: FulfillmentActionReq): Promise<FulfillmentResp> {
		return await this.call<FulfillmentResp>({
			method: 'PATCH',
			url: this.RESOURCE.MarkFulfilled(encodeURIComponent(id)),
			body,
		});
	}

	async markShipped(id: string, body: FulfillmentActionReq): Promise<FulfillmentResp> {
		return await this.call<FulfillmentResp>({
			method: 'PATCH',
			url: this.RESOURCE.MarkShipped(encodeURIComponent(id)),
			body,
		});
	}

	async markDelivered(id: string, body: FulfillmentActionReq): Promise<FulfillmentResp> {
		return await this.call<FulfillmentResp>({
			method: 'PATCH',
			url: this.RESOURCE.MarkDelivered(encodeURIComponent(id)),
			body,
		});
	}
}

export default FulfillmentModule;
