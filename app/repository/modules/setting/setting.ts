import HttpFactory from '../../factory';
import MerchantRoutes from '../../routes.client';
import type { UpdateSettingReq } from './models/request/update-setting.req';
import type { BaseODataResp } from '~/repository/base/base.resp';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { SettingsResp } from './models/response/setting.resp';

class SettingModule extends HttpFactory {
	private RESOURCE = MerchantRoutes.Settings;

	async getMany(query: BaseODataReq): Promise<BaseODataResp<SettingsResp>> {
		return await this.call<BaseODataResp<SettingsResp>>({
			method: 'GET',
			url: `${this.RESOURCE.Many()}`,
			query,
		});
	}

	async saveMany(settings: UpdateSettingReq): Promise<BaseODataResp<SettingsResp>> {
		return await this.call<BaseODataResp<SettingsResp>>({
			method: 'POST',
			url: `${this.RESOURCE.SaveMany()}`,
			body: settings,
		});
	}
}

export default SettingModule;
