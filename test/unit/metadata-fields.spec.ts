import { describe, expect, it } from 'vitest';
import { buildMetadata, createMetadataFields } from '../../app/utils/metadata-fields';

describe('metadata fields', () => {
	it('creates typed fields from existing metadata values', () => {
		const fields = createMetadataFields({
			min_amount: 1,
			is_required: true,
			channel: 'store',
			limits: { daily: 10 },
		});

		expect(fields).toEqual([
			{ key: 'min_amount', type: 'number', value: 1 },
			{ key: 'is_required', type: 'boolean', value: true },
			{ key: 'channel', type: 'string', value: 'store' },
			{ key: 'limits', type: 'json', value: '{\n  "daily": 10\n}' },
		]);
	});

	it('builds metadata from edited field values', () => {
		const result = buildMetadata([
			{ key: 'min_amount', type: 'number', value: '2.5' },
			{ key: 'is_required', type: 'boolean', value: false },
			{ key: 'channel', type: 'string', value: 'online' },
			{ key: 'limits', type: 'json', value: '{ "daily": 20 }' },
		]);

		expect(result).toEqual({
			ok: true,
			metadata: {
				min_amount: 2.5,
				is_required: false,
				channel: 'online',
				limits: { daily: 20 },
			},
		});
	});

	it('reports invalid json metadata fields', () => {
		const result = buildMetadata([{ key: 'limits', type: 'json', value: '{ nope' }]);

		expect(result).toEqual({
			ok: false,
			key: 'limits',
			message: 'Metadata value must be valid JSON.',
		});
	});
});
