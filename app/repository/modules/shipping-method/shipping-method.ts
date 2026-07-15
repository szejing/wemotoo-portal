import HttpFactory from '~/repository/factory';
import MerchantRoutes from '~/repository/routes.client';
import type { CreateShippingMethodReq } from './models/request/create-shipping-method.req';
import type { ResolveShippingMethodsReq } from './models/request/resolve-shipping-methods.req';
import type { UpdateShippingMethodReq } from './models/request/update-shipping-method.req';
import type { ResolveShippingMethodsResp } from './models/response/resolve-shipping-methods.resp';
import type { ShippingMethodResp } from './models/response/shipping-method.resp';
import type { BaseODataResp } from '~/repository/base/base.resp';
import type { ShippingMethodOption } from '~/utils/types/order-fulfillment-shipping';
import type { BaseODataReq } from '~/repository/base/base.req';

class ShippingMethodModule extends HttpFactory {
	private readonly RESOURCE = MerchantRoutes.ShippingMethods;

	async getMany(query: BaseODataReq): Promise<BaseODataResp<ShippingMethodOption>> {
		const data = await this.call<BaseODataResp<ShippingMethodOption>>({
			method: 'GET',
			url: this.RESOURCE.Many(),
			query,
		});

		return data;
	}

	async getSingle(id: string): Promise<ShippingMethodResp> {
		return await this.call<ShippingMethodResp>({
			method: 'GET',
			url: this.RESOURCE.Single(id),
		});
	}

	async resolveMethods(query: ResolveShippingMethodsReq): Promise<ResolveShippingMethodsResp> {
		return await this.call<ResolveShippingMethodsResp>({
			method: 'GET',
			url: this.RESOURCE.Resolve(),
			query,
		});
	}

	async create(body: CreateShippingMethodReq): Promise<ShippingMethodResp> {
		return await this.call<ShippingMethodResp>({
			method: 'POST',
			url: this.RESOURCE.Create(),
			body,
		});
	}

	async update(id: string, body: UpdateShippingMethodReq): Promise<ShippingMethodResp> {
		return await this.call<ShippingMethodResp>({
			method: 'PATCH',
			url: this.RESOURCE.Single(id),
			body,
		});
	}

	async remove(id: string): Promise<ShippingMethodResp> {
		return await this.call<ShippingMethodResp>({
			method: 'DELETE',
			url: this.RESOURCE.Single(id),
		});
	}
}

export default ShippingMethodModule;
