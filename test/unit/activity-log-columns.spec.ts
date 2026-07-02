import { describe, expect, it } from 'vitest';
import { activityLogActions } from '../../app/utils/options/activity-log';
import { ACTIVITY_LOG_COLUMN_LABELS, getActivityLogColumns } from '../../app/utils/table-columns/activity-log';

describe('activity log table columns', () => {
	it('exposes the expected column labels for visibility controls', () => {
		expect(ACTIVITY_LOG_COLUMN_LABELS).toEqual({
			created_at: 'table.createdAt',
			desc: 'table.description',
			action: 'table.action',
			actor: 'table.actor',
			source: 'table.source',
			visibility: 'table.visibility',
			ref_no: 'table.reference',
		});
	});

	it('builds columns for the activity log list', () => {
		const columns = getActivityLogColumns((key) => key);

		expect(columns.map((column) => column.accessorKey ?? column.id)).toEqual(['created_at', 'desc', 'action', 'actor', 'source', 'visibility', 'ref_no']);
	});

	it('includes auth session actions in filter options', () => {
		expect(activityLogActions).toEqual(expect.arrayContaining(['login', 'logout', 'relogin']));
	});
});
