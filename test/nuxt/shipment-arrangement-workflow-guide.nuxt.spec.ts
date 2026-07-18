import { describe, expect, it, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import WorkflowGuide from '~/components/ShipmentArrangement/WorkflowGuide.vue';

describe('ShipmentArrangementWorkflowGuide', () => {
	it('renders the selected three-step workflow and consequence warning', async () => {
		const wrapper = await mountSuspended(WorkflowGuide, {
			props: { pendingCount: 47 },
		});

		expect(wrapper.text()).toContain('Export pending');
		expect(wrapper.text()).toContain('Download 47 pending batches');
		expect(wrapper.text()).toContain('Fill courier & tracking');
		expect(wrapper.text()).toContain('Import & review');
		expect(wrapper.text()).toContain('may send customer emails');
		expect(wrapper.findAll('[data-testid="workflow-step"]')).toHaveLength(3);
	});

	it('keeps export and workbook selection reachable from the guide', async () => {
		const onExport = vi.fn();
		const onImport = vi.fn();
		const wrapper = await mountSuspended(WorkflowGuide, {
			props: { pendingCount: 2, onExport, onImport },
		});

		await wrapper.get('[data-testid="workflow-export"]').trigger('click');
		await wrapper.get('[data-testid="workflow-import"]').trigger('click');

		expect(onExport).toHaveBeenCalledTimes(1);
		expect(onImport).toHaveBeenCalledTimes(1);
	});
});
