import HttpFactory from '~/repository/factory';
import MerchantRoutes from '~/repository/routes.client';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { BaseODataResp } from '~/repository/base/base.resp';
import type { ActivityLog } from '~/utils/types/activity-log';

class ActivityLogModule extends HttpFactory {
	private RESOURCE = MerchantRoutes.ActivityLogs;

	async getMany(query: BaseODataReq): Promise<BaseODataResp<ActivityLog>> {
		return this.call<BaseODataResp<ActivityLog>>({
			method: 'GET',
			url: this.RESOURCE.Many(),
			query,
		});
	}
}

export default ActivityLogModule;
