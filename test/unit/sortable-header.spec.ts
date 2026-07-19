import { describe, expect, it, vi } from 'vitest';
import type { Column } from '@tanstack/vue-table';
import type { VNode } from 'vue';
import { getSortableHeader } from '../../app/utils/table-columns/styles';

vi.mock('#components', () => ({
	UIcon: { name: 'UIcon' },
}));

function createColumn(sorted: false | 'asc' | 'desc' = false): Column<unknown, unknown> {
	return {
		getIsSorted: () => sorted,
		toggleSorting: vi.fn(),
	} as unknown as Column<unknown, unknown>;
}

function asVNode(node: unknown): VNode {
	return node as VNode;
}

function className(value: unknown): string {
	return typeof value === 'string' ? value : Array.isArray(value) ? value.flat().filter(Boolean).join(' ') : '';
}

function buttonOf(wrapper: VNode): VNode {
	return ((wrapper.children as VNode[])[0] ?? wrapper) as VNode;
}

function iconOf(button: VNode): VNode | undefined {
	const children = Array.isArray(button.children) ? (button.children as VNode[]) : [];
	return children.find((child) => child && typeof child === 'object' && 'type' in child);
}

function labelOf(button: VNode): string | undefined {
	const children = Array.isArray(button.children) ? button.children : [];
	return children.find((child) => typeof child === 'string') as string | undefined;
}

describe('getSortableHeader', () => {
	it('matches headerCell wrapper alignment and uses a plain button with muted unsorted trailing icon', () => {
		const wrapper = asVNode(getSortableHeader(createColumn(false), 'Customer'));
		const button = buttonOf(wrapper);
		const icon = iconOf(button);

		expect(className(wrapper.props?.class)).toContain('text-left');
		expect(button.type).toBe('button');
		expect(labelOf(button)).toBe('Customer');
		expect(icon?.props?.name).toBe('i-lucide-arrow-up-down');
		expect(button.props?.['aria-sort']).toBe('none');
		expect(className(icon?.props?.class)).toContain('text-muted');
	});

	it('highlights ascending sort state on the button', () => {
		const wrapper = asVNode(getSortableHeader(createColumn('asc'), 'Customer'));
		const button = buttonOf(wrapper);
		const icon = iconOf(button);

		expect(icon?.props?.name).toBe('i-lucide-arrow-up-narrow-wide');
		expect(button.props?.['aria-sort']).toBe('ascending');
		expect(className(button.props?.class)).toContain('text-highlighted');
		expect(className(icon?.props?.class)).toContain('text-highlighted');
	});

	it('highlights descending sort state on the button', () => {
		const wrapper = asVNode(getSortableHeader(createColumn('desc'), 'Customer'));
		const button = buttonOf(wrapper);
		const icon = iconOf(button);

		expect(icon?.props?.name).toBe('i-lucide-arrow-down-wide-narrow');
		expect(button.props?.['aria-sort']).toBe('descending');
		expect(className(icon?.props?.class)).toContain('text-highlighted');
	});

	it('puts the sort icon on the leading side for right-aligned headers', () => {
		const wrapper = asVNode(getSortableHeader(createColumn(false), 'Net Amt', 'right'));
		const button = buttonOf(wrapper);
		const children = Array.isArray(button.children) ? (button.children as unknown[]) : [];
		const icon = children[0] as VNode;
		const label = children[1];

		expect(className(wrapper.props?.class)).toContain('text-right');
		expect(icon?.props?.name).toBe('i-lucide-arrow-up-down');
		expect(label).toBe('Net Amt');
		expect(className(icon?.props?.class)).toContain('text-muted');
	});
});
