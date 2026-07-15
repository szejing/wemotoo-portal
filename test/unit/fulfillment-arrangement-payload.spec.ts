import { describe, expect, it } from 'bun:test';
import { buildFulfillmentArrangementPayload } from '../../app/utils/fulfillment';

describe('simple fulfillment arrangement payload', () => {
	it('submits only courier and tracking values', () => {
		expect(buildFulfillmentArrangementPayload({
			courier_id: 2,
			courier_name: 'DHL',
			tracking_no: '  TRACK-2  ',
		})).toEqual({
			courier_id: 2,
			courier_name: 'DHL',
			tracking_no: 'TRACK-2',
		});
	});

	it('preserves a snapshot courier and normalizes blank tracking', () => {
		expect(buildFulfillmentArrangementPayload({
			courier_id: null,
			courier_name: 'Merchant Fleet',
			tracking_no: '   ',
		})).toEqual({
			courier_id: null,
			courier_name: 'Merchant Fleet',
			tracking_no: null,
		});
	});
});
