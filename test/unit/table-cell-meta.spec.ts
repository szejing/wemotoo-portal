import { describe, expect, it } from 'vitest';
import { TABLE_ALIGN_CENTER, TABLE_ALIGN_RIGHT, tableCellMeta } from '../../app/utils/table-columns/styles';

describe('tableCellMeta', () => {
	it('nests alignment classes under meta for Nuxt UI Table columnDef', () => {
		expect(tableCellMeta.center).toEqual({
			meta: {
				class: {
					th: TABLE_ALIGN_CENTER,
					td: TABLE_ALIGN_CENTER,
				},
			},
		});

		expect(tableCellMeta.rightNumeric).toEqual({
			meta: {
				class: {
					th: TABLE_ALIGN_RIGHT,
					td: TABLE_ALIGN_RIGHT,
				},
			},
		});
	});
});
