import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import ZSectionOrderDetailCustomerEmail from '~/components/Z/Section/Order/Detail/CustomerEmail.vue';

describe('ZSectionOrderDetailCustomerEmail', () => {
	it('renders description and button text', async () => {
		const wrapper = await mountSuspended(ZSectionOrderDetailCustomerEmail, {
			props: {
				description: '',
				resendEmailLabel: 'receipt',
				customerEmailAddress: 'customer@example.com',
				buttonText: 'Resend receipt',
			},
		});

		expect(wrapper.text()).toContain('Customer email');
		expect(wrapper.text()).toContain('Ready to resend receipt to customer@example.com.');
		expect(wrapper.text()).toContain('Resend receipt');
	});

	it('renders a mailto link for the customer email address', async () => {
		const wrapper = await mountSuspended(ZSectionOrderDetailCustomerEmail, {
			props: {
				description: '',
				resendEmailLabel: 'invoice',
				customerEmailAddress: 'customer@example.com',
				buttonText: 'Resend invoice',
			},
		});

		const link = wrapper.find('a.customer-email-link');
		expect(link.exists()).toBe(true);
		expect(link.attributes('href')).toBe('mailto:customer@example.com');
		expect(link.text()).toBe('customer@example.com');
		expect(link.classes()).toContain('customer-email-link');
	});

	it('disables the resend button when disabled', async () => {
		const wrapper = await mountSuspended(ZSectionOrderDetailCustomerEmail, {
			props: {
				description: 'No email available for this status.',
				buttonText: 'No email available',
				disabled: true,
			},
		});

		const btn = wrapper.find('[data-testid="customer-email-resend"]');
		expect(btn.exists()).toBe(true);
		const disabledAttr = btn.attributes().disabled ?? btn.attributes('disabled');
		const hasDomDisabled =
			disabledAttr !== undefined ||
			btn.element.hasAttribute('disabled') ||
			btn.attributes('aria-disabled') === 'true';
		expect(hasDomDisabled).toBe(true);
	});

	it('emits resend when the button is clicked', async () => {
		const wrapper = await mountSuspended(ZSectionOrderDetailCustomerEmail, {
			props: {
				description: '',
				resendEmailLabel: 'invoice',
				customerEmailAddress: 'customer@example.com',
				buttonText: 'Resend invoice',
			},
		});

		await wrapper.find('[data-testid="customer-email-resend"]').trigger('click');
		expect(wrapper.emitted('resend')).toHaveLength(1);
	});
});
