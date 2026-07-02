import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import SettingsSystemIndexPage from '~/pages/settings/system/index.vue';

describe('SettingsSystemIndexPage', () => {
	it('renders system settings hub with configuration, reasons, and activity logs links', async () => {
		const wrapper = await mountSuspended(SettingsSystemIndexPage);

		expect(wrapper.text()).toContain('System');
		expect(wrapper.text()).toContain('Configuration');
		expect(wrapper.text()).toContain('Reasons');
		expect(wrapper.text()).toContain('Activity Logs');
	});
});
