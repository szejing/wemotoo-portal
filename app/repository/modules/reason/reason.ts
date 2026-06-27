import HttpFactory from '~/repository/factory';
import MerchantRoutes from '~/repository/routes.client';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { CreateReasonReq } from './models/request/create-reason.req';
import type { UpdateReasonReq } from './models/request/update-reason.req';
import type { ReasonResp } from './models/response/reason.resp';
import type { BaseODataResp } from '~/repository/base/base.resp';
import type { Reason } from '~/utils/types/reason';

class ReasonModule extends HttpFactory {
	private readonly RESOURCE = MerchantRoutes.Reasons;

	async getMany(query: BaseODataReq): Promise<BaseODataResp<Reason>> {
		return await this.call<BaseODataResp<Reason>>({
			method: 'GET',
			url: this.RESOURCE.Many(),
			query,
		});
	}

	async getSingle(code: string): Promise<ReasonResp> {
		return await this.call<ReasonResp>({
			method: 'GET',
			url: this.RESOURCE.Single(code),
		});
	}

	async create(body: CreateReasonReq): Promise<ReasonResp> {
		return await this.call<ReasonResp>({
			method: 'POST',
			url: this.RESOURCE.Create(),
			body,
		});
	}

	async update(code: string, body: UpdateReasonReq): Promise<ReasonResp> {
		return await this.call<ReasonResp>({
			method: 'PATCH',
			url: this.RESOURCE.Update(code),
			body,
		});
	}

	async remove(code: string): Promise<ReasonResp> {
		return await this.call<ReasonResp>({
			method: 'DELETE',
			url: this.RESOURCE.Delete(code),
		});
	}
}

export default ReasonModule;
