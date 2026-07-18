import HttpFactory from '~/repository/factory';
import MerchantRoutes from '~/repository/routes.client';
import type { FulfillmentActionReq } from './models/request/fulfillment-action.req';
import type { UpdateFulfillmentReq } from './models/request/update-fulfillment.req';
import type { FulfillmentResp } from './models/response/fulfillment.resp';
import type {
	ShipmentArrangementApplyRequest,
	ShipmentArrangementApplyResponse,
	ShipmentArrangementListResponse,
	ShipmentArrangementPreviewResponse,
	ShipmentArrangementQuery,
} from '~/utils/types/shipment-arrangement';

class FulfillmentModule extends HttpFactory {
	private readonly RESOURCE = MerchantRoutes.Fulfillment;

	async getShipmentArrangement(query: ShipmentArrangementQuery): Promise<ShipmentArrangementListResponse> {
		return await this.call<ShipmentArrangementListResponse>({
			method: 'GET',
			url: this.RESOURCE.Arrangement.List(),
			query,
		});
	}

	async downloadShipmentArrangement(query: ShipmentArrangementQuery): Promise<Blob> {
		return await this.call<Blob>({
			method: 'GET',
			url: this.RESOURCE.Arrangement.Export(),
			query,
			fetchOptions: { responseType: 'blob' },
		});
	}

	async previewShipmentArrangement(file: File): Promise<ShipmentArrangementPreviewResponse> {
		const body = new FormData();
		body.append('file', file);
		return await this.call<ShipmentArrangementPreviewResponse>({
			method: 'POST',
			url: this.RESOURCE.Arrangement.Preview(),
			body,
			headers: {},
		});
	}

	async applyShipmentArrangement(body: ShipmentArrangementApplyRequest): Promise<ShipmentArrangementApplyResponse> {
		return await this.call<ShipmentArrangementApplyResponse>({
			method: 'POST',
			url: this.RESOURCE.Arrangement.Apply(),
			body,
		});
	}

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
