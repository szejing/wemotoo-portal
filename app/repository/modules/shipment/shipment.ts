import HttpFactory from '~/repository/factory';
import MerchantRoutes from '~/repository/routes.client';
import type { CreateShipmentReq } from './models/request/create-shipment.req';
import type { MarkDeliveredReq } from './models/request/mark-delivered.req';
import type { MarkShippedReq } from './models/request/mark-shipped.req';
import type { UpdateShipmentReq } from './models/request/update-shipment.req';
import type { GetShipmentsResp } from './models/response/get-shipments.resp';
import type { ShipmentResp } from './models/response/shipment.resp';

class ShipmentModule extends HttpFactory {
	private readonly RESOURCE = MerchantRoutes.Shipment;

	async create(body: CreateShipmentReq): Promise<ShipmentResp> {
		return await this.call<ShipmentResp>({
			method: 'POST',
			url: this.RESOURCE.Create(),
			body,
		});
	}

	async getMany(): Promise<GetShipmentsResp> {
		return await this.call<GetShipmentsResp>({
			method: 'GET',
			url: this.RESOURCE.Many(),
		});
	}

	async getSingle(id: string): Promise<ShipmentResp> {
		return await this.call<ShipmentResp>({
			method: 'GET',
			url: this.RESOURCE.Single(id),
		});
	}

	async update(id: string, body: UpdateShipmentReq): Promise<ShipmentResp> {
		return await this.call<ShipmentResp>({
			method: 'PATCH',
			url: this.RESOURCE.Update(id),
			body,
		});
	}

	async remove(id: string): Promise<ShipmentResp> {
		return await this.call<ShipmentResp>({
			method: 'DELETE',
			url: this.RESOURCE.Delete(id),
		});
	}

	async markShipped(id: string, body: MarkShippedReq): Promise<ShipmentResp> {
		return await this.call<ShipmentResp>({
			method: 'PATCH',
			url: this.RESOURCE.MarkShipped(id),
			body,
		});
	}

	async markDelivered(id: string, body: MarkDeliveredReq): Promise<ShipmentResp> {
		return await this.call<ShipmentResp>({
			method: 'PATCH',
			url: this.RESOURCE.MarkDelivered(id),
			body,
		});
	}
}

export default ShipmentModule;
