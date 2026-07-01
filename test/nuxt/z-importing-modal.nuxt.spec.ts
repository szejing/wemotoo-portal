import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent } from 'vue';
import ZModalImporting from '~/components/Z/Modal/Importing.vue';

const UModalStub = defineComponent({
	name: 'UModal',
	props: {
		close: {
			type: Boolean,
			default: true,
		},
		dismissible: {
			type: Boolean,
			default: true,
		},
		ui: {
			type: Object,
			default: undefined,
		},
	},
	template: '<section><slot name="body" /></section>',
});

describe('ZModalImporting', () => {
	it('locks the modal and uses a visible processing animation', async () => {
		const wrapper = await mountSuspended(ZModalImporting, {
			global: {
				stubs: {
					UModal: UModalStub,
				},
			},
		});
		const modal = wrapper.findComponent(UModalStub);

		expect(modal.props('close')).toBe(false);
		expect(modal.props('dismissible')).toBe(false);
		expect(wrapper.find('[data-slot="header"]').exists()).toBe(false);
		expect(wrapper.html()).not.toContain('animate-pulse');
		expect(wrapper.find('[data-testid="importing-icon-ring"]').classes()).toContain('motion-safe:animate-spin');
	});
});
