import { describe, expect, it, vi } from 'vitest';
import { activityLogActions } from '../../app/utils/options/activity-log';
import { ACTIVITY_LOG_COLUMN_LABELS, getActivityLogColumns } from '../../app/utils/table-columns/activity-log';
import type { ActivityLog } from '../../app/utils/types/activity-log';

vi.mock('#components', () => ({
	UBadge: { name: 'UBadge' },
}));

const renderDescCell = (log: Partial<ActivityLog>) => {
	const columns = getActivityLogColumns((key) => key);
	const descColumn = columns.find((column) => column.accessorKey === 'desc');
	expect(descColumn?.cell).toEqual(expect.any(Function));

	return (descColumn!.cell as Function)({
		row: {
			original: {
				id: 1,
				desc: 'Customer description',
				created_at: '2026-07-18T10:00:00.000Z',
				...log,
			} satisfies ActivityLog,
		},
	});
};

const collectNodes = (node: unknown, acc: Array<Record<string, unknown>> = []) => {
	if (!node || typeof node !== 'object') {
		return acc;
	}

	const vnode = node as {
		type?: unknown;
		props?: Record<string, unknown>;
		children?: unknown;
	};

	acc.push({
		type: vnode.type,
		props: vnode.props,
		children: vnode.children,
	});

	if (Array.isArray(vnode.children)) {
		for (const child of vnode.children) {
			collectNodes(child, acc);
		}
	}

	return acc;
};

const badgeLabels = (nodes: Array<Record<string, unknown>>) =>
	nodes
		.filter((node) => typeof node.type === 'object' && (node.type as { name?: string }).name === 'UBadge')
		.map((node) => {
			const children = node.children as { default?: () => unknown } | (() => unknown) | undefined;
			if (typeof children === 'function') {
				return children();
			}
			if (typeof children?.default === 'function') {
				return children.default();
			}
			return undefined;
		});

describe('activity log table columns', () => {
	it('exposes the expected column labels for visibility controls', () => {
		expect(ACTIVITY_LOG_COLUMN_LABELS).toEqual({
			created_at: 'table.createdAt',
			desc: 'table.description',
			action: 'table.action',
			actor: 'table.actor',
			source: 'table.source',
		});
	});

	it('builds columns for the activity log list', () => {
		const columns = getActivityLogColumns((key) => key);

		expect(columns.map((column) => column.accessorKey ?? column.id)).toEqual(['created_at', 'action', 'desc', 'source', 'actor']);
	});

	it('renders description rich text with UBadge segments like Activities', () => {
		const nodes = collectNodes(
			renderDescCell({
				internal_desc: 'Order <UI>#160622</UI> status changed from <UBadge>paid</UBadge> to <UBadge>completed</UBadge>',
				desc: 'Your order was completed',
			}),
		);

		expect(nodes.some((node) => node.children === '#160622')).toBe(true);
		expect(nodes.some((node) => node.props?.class === 'italic underline decoration-dotted underline-offset-4 text-highlighted')).toBe(true);
		expect(badgeLabels(nodes)).toEqual(['paid', 'completed']);
		expect(nodes.some((node) => node.children === 'Your order was completed')).toBe(false);
	});

	it('prefers internal_desc over desc and does not render customer desc', () => {
		const nodes = collectNodes(
			renderDescCell({
				internal_desc: 'Admin saw <B>RM 12.00</B>',
				desc: 'Customer saw payment',
			}),
		);

		expect(nodes.some((node) => node.props?.class === 'font-bold text-highlighted' && node.children === 'RM 12.00')).toBe(true);
		expect(nodes.some((node) => node.children === 'Customer saw payment')).toBe(false);
	});

	it('includes auth session and email actions in filter options', () => {
		expect(activityLogActions).toEqual(expect.arrayContaining(['login', 'logout', 'relogin', 'email_sent']));
	});

	it('constrains description cells so rich text cannot overflow into adjacent columns', () => {
		const columns = getActivityLogColumns((key) => key);
		const descColumn = columns.find((column) => column.accessorKey === 'desc');

		expect(descColumn?.meta).toEqual({
			class: {
				th: 'min-w-[16rem] max-w-lg',
				td: 'min-w-[16rem] max-w-lg overflow-hidden',
			},
		});
	});
});
