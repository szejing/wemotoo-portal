import { describe, expect, it } from 'vitest';
import { formatCustomerNameEmail } from '../../app/utils/format-customer-name-email';

describe('formatCustomerNameEmail', () => {
	it('returns name | email when they differ', () => {
		expect(formatCustomerNameEmail('Jane Doe', 'jane@example.com')).toBe('Jane Doe | jane@example.com');
	});

	it('returns email only when name and email match after trim and case-insensitive compare', () => {
		expect(formatCustomerNameEmail('jane@example.com', 'jane@example.com')).toBe('jane@example.com');
		expect(formatCustomerNameEmail('  Jane@Example.com  ', 'jane@example.com')).toBe('jane@example.com');
	});

	it('returns email when name is empty', () => {
		expect(formatCustomerNameEmail('', 'jane@example.com')).toBe('jane@example.com');
		expect(formatCustomerNameEmail(undefined, 'jane@example.com')).toBe('jane@example.com');
	});

	it('returns name when email is empty', () => {
		expect(formatCustomerNameEmail('Jane Doe', '')).toBe('Jane Doe');
		expect(formatCustomerNameEmail('Jane Doe', undefined)).toBe('Jane Doe');
	});

	it('returns empty string when both are empty', () => {
		expect(formatCustomerNameEmail('', '')).toBe('');
		expect(formatCustomerNameEmail(undefined, undefined)).toBe('');
	});
});
