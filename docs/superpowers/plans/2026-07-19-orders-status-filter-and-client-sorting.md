# Orders Status Filter Badges & Client Sorting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the orders multi-status filter with badge `USelectMenu` UX, and add client-side column sorting on the orders table for the current page only.

**Architecture:** Enhance generic `ZSectionFilterStatuses` with optional `getColor` badge rendering (orders page passes `getOrderStatusColor`). Add a reusable `sortableHeaderCell` helper for TanStack/Nuxt UI sort buttons, wire it into `getOrderColumns`, and bind local `v-model:sorting` on the orders `UTable`. No store/OData/`$orderby` changes.

**Tech Stack:** Vue 3, Nuxt 4, Nuxt UI v4 (`USelectMenu`, `UTable`, `UBadge`, `UButton`), TanStack Table sorting, TypeScript, Vitest / `@nuxt/test-utils`.

## Global Constraints

- Keep multi-select status filter (`string[]` / `OrderStatus[]`); do not switch to single-select `ZSelectMenuOrderStatus`.
- Leave `app/components/Z/SelectMenu/OrderStatus.vue` unchanged.
- Sorting is client-side on the currently loaded page only; do not change Order store `$orderby`.
- Use Node-based Nuxt/Vitest commands; do not run portal Nuxt with `bun --bun`.
- Spec: `docs/superpowers/specs/2026-07-19-orders-status-filter-and-client-sorting-design.md`

## File map

- Modify: `app/components/Z/Section/Filter/Statuses.vue`
- Modify: `test/nuxt/z-section-filter-statuses.nuxt.spec.ts`
- Modify: `app/pages/orders/index.vue`
- Modify: `app/utils/table-columns/styles.ts`
- Modify: `app/utils/table-columns/order/order.ts`
- Create: `test/unit/order-columns-sorting.spec.ts`

---

### Task 1: Badge multi-select `ZSectionFilterStatuses`

**Files:**
- Modify: `test/nuxt/z-section-filter-statuses.nuxt.spec.ts`
- Modify: `app/components/Z/Section/Filter/Statuses.vue`
- Modify: `app/pages/orders/index.vue`

**Interfaces:**
- Consumes: existing `modelValue: string[]`, `items: StatusFilterItem[]`
- Produces: optional prop `getColor?: (value: string) => UiBadgeColor | undefined`; component uses `USelectMenu` with `multiple`

- [ ] **Step 1: Update the Nuxt test to expect `USelectMenu` + badge path**

Replace `test/nuxt/z-section-filter-statuses.nuxt.spec.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { OrderStatus } from 'yeppi-common';
import ZSectionFilterStatuses from '~/components/Z/Section/Filter/Statuses.vue';

const items = [
	{ label: 'Pending Payment', value: OrderStatus.PENDING_PAYMENT },
	{ label: 'Processing', value: OrderStatus.PROCESSING },
	{ label: 'Completed', value: OrderStatus.COMPLETED },
];

describe('ZSectionFilterStatuses', () => {
	it('renders a multiple USelectMenu with status items', async () => {
		const wrapper = await mountSuspended(ZSectionFilterStatuses, {
			props: {
				modelValue: [OrderStatus.PENDING_PAYMENT],
				items,
			},
		});

		const select = wrapper.findComponent({ name: 'USelectMenu' });
		expect(select.exists()).toBe(true);
		expect(select.props('multiple')).toBe(true);
		expect(select.props('items')).toEqual(items);
		expect(select.props('modelValue')).toEqual([OrderStatus.PENDING_PAYMENT]);
	});

	it('renders status badges in the trigger when getColor is provided', async () => {
		const wrapper = await mountSuspended(ZSectionFilterStatuses, {
			props: {
				modelValue: [OrderStatus.PENDING_PAYMENT, OrderStatus.PROCESSING],
				items,
				getColor: () => 'warning',
			},
		});

		const badges = wrapper.findAllComponents({ name: 'UBadge' });
		expect(badges.length).toBeGreaterThanOrEqual(2);
	});

	it('emits update:modelValue when selection changes', async () => {
		const wrapper = await mountSuspended(ZSectionFilterStatuses, {
			props: {
				modelValue: [],
				items,
			},
		});

		const select = wrapper.findComponent({ name: 'USelectMenu' });
		await select.vm.$emit('update:modelValue', [OrderStatus.COMPLETED, OrderStatus.PROCESSING]);

		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[OrderStatus.COMPLETED, OrderStatus.PROCESSING]]);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/szejinggo/Documents/Projects/ecommerce/wemotoo-portal
npm run test:vitest:run -- test/nuxt/z-section-filter-statuses.nuxt.spec.ts
```

Expected: FAIL — still mounts `USelect`, or no badge path.

- [ ] **Step 3: Implement `Statuses.vue` with `USelectMenu` + optional badges**

Replace `app/components/Z/Section/Filter/Statuses.vue` with:

```vue
<template>
	<div class="flex flex-col gap-1.5 min-w-0" :class="wrapperClass">
		<label v-if="showLabel" class="text-xs font-medium text-gray-700 dark:text-gray-300">
			{{ label || $t('components.filter.status') }}
		</label>
		<USelectMenu
			v-model="selected"
			multiple
			:items="items"
			value-key="value"
			:placeholder="placeholder || $t('components.selectMenu.selectStatus')"
			:disabled="disabled"
			color="neutral"
			variant="outline"
			class="w-full min-w-48 sm:min-w-56"
			:search-input="{
				placeholder: 'Search status…',
				icon: 'i-lucide-search',
			}"
			:ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform' }"
		>
			<template #default>
				<div v-if="selectedLabels.length > 0" class="flex flex-wrap gap-1.5 min-w-0">
					<template v-if="getColor">
						<UBadge
							v-for="entry in selectedLabels"
							:key="entry.value"
							:color="getColor(entry.value) ?? 'neutral'"
							variant="subtle"
							class="truncate"
						>
							{{ entry.label }}
						</UBadge>
					</template>
					<template v-else>
						<span
							v-for="entry in selectedLabels"
							:key="entry.value"
							class="text-sm text-default truncate"
						>
							{{ entry.label }}
						</span>
					</template>
				</div>
				<span v-else class="text-neutral-400">{{ placeholder || $t('components.selectMenu.selectStatus') }}</span>
			</template>

			<template #item="{ item }">
				<UBadge
					v-if="getColor"
					:color="getColor(item.value) ?? 'neutral'"
					variant="subtle"
					class="truncate"
				>
					{{ item.label }}
				</UBadge>
				<span v-else>{{ item.label }}</span>
			</template>
		</USelectMenu>
	</div>
</template>

<script lang="ts" setup>
import type { UiBadgeColor } from 'yeppi-common';

export type StatusFilterItem = {
	label: string;
	value: string;
};

const props = withDefaults(
	defineProps<{
		modelValue?: string[];
		items: StatusFilterItem[];
		label?: string;
		placeholder?: string;
		showLabel?: boolean;
		disabled?: boolean;
		wrapperClass?: string;
		getColor?: (value: string) => UiBadgeColor | undefined;
	}>(),
	{
		modelValue: () => [],
		label: undefined,
		placeholder: undefined,
		showLabel: false,
		disabled: false,
		wrapperClass: undefined,
		getColor: undefined,
	},
);

const emit = defineEmits<{
	'update:modelValue': [value: string[]];
}>();

const selected = computed({
	get() {
		return props.modelValue ?? [];
	},
	set(value: string[] | undefined) {
		emit('update:modelValue', Array.isArray(value) ? value : []);
	},
});

const selectedLabels = computed(() => {
	const values = selected.value;
	return values.map((value) => {
		const match = props.items.find((item) => item.value === value);
		return { value, label: match?.label ?? value };
	});
});
</script>

<style scoped></style>
```

- [ ] **Step 4: Pass `getColor` from the orders page**

In `app/pages/orders/index.vue`:

1. Import `getOrderStatusColor` alongside existing options imports:

```ts
import { getDefaultOrderStatuses, getOrderStatusColor, getOrderStatusOptions, options_page_size } from '~/utils/options';
```

2. Update the toolbar filter usage:

```vue
<ZSectionFilterStatuses
	v-model="selectedStatuses"
	:items="statusItems"
	:get-color="getOrderStatusColor"
	:placeholder="$t('components.selectMenu.selectOrderStatus')"
	class="w-full sm:w-72"
	@update:model-value="onStatusesChange"
/>
```

- [ ] **Step 5: Run Statuses Nuxt test**

```bash
cd /Users/szejinggo/Documents/Projects/ecommerce/wemotoo-portal
npm run test:vitest:run -- test/nuxt/z-section-filter-statuses.nuxt.spec.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/szejinggo/Documents/Projects/ecommerce/wemotoo-portal
git add \
  app/components/Z/Section/Filter/Statuses.vue \
  app/pages/orders/index.vue \
  test/nuxt/z-section-filter-statuses.nuxt.spec.ts
git commit -m "$(cat <<'EOF'
feat(orders): badge multi-select status filter

Restyle ZSectionFilterStatuses with USelectMenu and optional status badges for the orders list.
EOF
)"
```

---

### Task 2: Sortable order column headers

**Files:**
- Create: `test/unit/order-columns-sorting.spec.ts`
- Modify: `app/utils/table-columns/styles.ts`
- Modify: `app/utils/table-columns/order/order.ts`

**Interfaces:**
- Consumes: TanStack `Column<any, unknown>` for sort state/toggle
- Produces: `sortableHeaderCell(column, label, align?)` in styles; sortable columns in `getOrderColumns` with `enableSorting: false` on `index`

- [ ] **Step 1: Write the failing unit test**

Create `test/unit/order-columns-sorting.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getOrderColumns } from '../../app/utils/table-columns/order/order';

describe('getOrderColumns sorting', () => {
	const columns = getOrderColumns((key) => key);

	const columnById = (id: string) => {
		const column = columns.find((entry) => ('id' in entry && entry.id === id) || ('accessorKey' in entry && entry.accessorKey === id));
		expect(column).toBeTruthy();
		return column!;
	};

	it('disables sorting on the index column', () => {
		expect(columnById('index').enableSorting).toBe(false);
	});

	it('enables sorting on data columns', () => {
		for (const id of ['order_no', 'order_type', 'customer', 'status', 'gross_amt', 'tax_amt_exc', 'net_amt']) {
			expect(columnById(id).enableSorting).not.toBe(false);
		}
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/szejinggo/Documents/Projects/ecommerce/wemotoo-portal
npm run test:vitest:run -- test/unit/order-columns-sorting.spec.ts
```

Expected: FAIL — `enableSorting` is undefined / not `false` on index.

- [ ] **Step 3: Add `sortableHeaderCell` helper**

In `app/utils/table-columns/styles.ts`, add imports and helper (keep existing exports):

```ts
import { h } from 'vue';
import type { Column } from '@tanstack/vue-table';
import { formatCurrency } from 'yeppi-common';
import { UButton } from '#components';

// ... existing TABLE_ALIGN_* / headerCell / moneyCell helpers unchanged ...

export function sortableHeaderCell(column: Column<any, unknown>, label: string, align: TableCellAlign = 'left') {
	const isSorted = column.getIsSorted();
	const alignClass = align === 'right' ? TABLE_ALIGN_RIGHT : align === 'center' ? TABLE_ALIGN_CENTER : 'text-left';

	return h(
		'div',
		{ class: alignClass },
		h(UButton, {
			color: 'neutral',
			variant: 'ghost',
			label,
			icon: isSorted ? (isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow') : 'i-lucide-arrow-up-down',
			class: '-mx-2.5',
			onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
		}),
	);
}
```

If `#components` import of `UButton` is awkward in this util (SSR/test), use `resolveComponent('UButton')` instead, matching Nuxt UI docs:

```ts
import { h, resolveComponent } from 'vue';
// ...
const UButton = resolveComponent('UButton');
```

Prefer whichever pattern already works for sibling table-column files (`order.ts` already imports `UBadge` from `#components`).

- [ ] **Step 4: Wire sortable headers into `getOrderColumns`**

In `app/utils/table-columns/order/order.ts`:

1. Import `sortableHeaderCell` from `../styles` (alongside `headerCell`).
2. Set `enableSorting: false` on the `index` column; keep its current `header: () => headerCell(...)`.
3. For each sortable column, change header to use `sortableHeaderCell` and leave accessors unchanged:

```ts
{
	id: 'order_no',
	accessorFn: (row) => (row.order_date_time ? new Date(row.order_date_time).getTime() : 0),
	header: ({ column }) => sortableHeaderCell(column, t('table.orderNo')),
	cell: ({ row }) => {
		return h('div', { class: 'flex flex-col gap-1' }, [
			h('p', { class: 'font-medium text-default' }, row.original.order_no),
			h('p', { class: 'text-sm text-muted' }, row.original.order_date_time),
		]);
	},
},
{
	id: 'order_type',
	accessorFn: (row) => ((row.order_type ?? OrderType.PICKUP) === OrderType.DELIVERY ? 1 : 0),
	header: ({ column }) => sortableHeaderCell(column, t('table.orderType'), 'center'),
	// ... existing cell + tableCellMeta.center
},
{
	id: 'customer',
	accessorFn: (row) => row.customer?.name ?? '',
	header: ({ column }) => sortableHeaderCell(column, t('table.customer')),
	// ... existing cell
},
{
	accessorKey: 'status',
	header: ({ column }) => sortableHeaderCell(column, t('table.status'), 'center'),
	// ... existing cell + tableCellMeta.center
},
{
	accessorKey: 'gross_amt',
	header: ({ column }) => sortableHeaderCell(column, t('table.grossAmt'), 'right'),
	// ... existing cell + tableCellMeta.rightNumeric
},
{
	accessorKey: 'tax_amt_exc',
	header: ({ column }) => sortableHeaderCell(column, t('table.taxAmtExc'), 'right'),
	// ... existing cell + tableCellMeta.rightNumeric
},
{
	accessorKey: 'net_amt',
	header: ({ column }) => sortableHeaderCell(column, t('table.netAmt'), 'right'),
	// ... existing cell + tableCellMeta.rightNumeric
},
```

Keep all existing `cell` renderers and status strip logic unchanged.

- [ ] **Step 5: Run column sorting unit test**

```bash
cd /Users/szejinggo/Documents/Projects/ecommerce/wemotoo-portal
npm run test:vitest:run -- test/unit/order-columns-sorting.spec.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/szejinggo/Documents/Projects/ecommerce/wemotoo-portal
git add \
  app/utils/table-columns/styles.ts \
  app/utils/table-columns/order/order.ts \
  test/unit/order-columns-sorting.spec.ts
git commit -m "$(cat <<'EOF'
feat(orders): enable client-side sortable order columns

Add sortableHeaderCell and mark order table data columns as sortable.
EOF
)"
```

---

### Task 3: Bind sorting state on orders page + verify

**Files:**
- Modify: `app/pages/orders/index.vue`

**Interfaces:**
- Consumes: `SortingState` from `@tanstack/vue-table` (or `@nuxt/ui` if re-exported)
- Produces: local `sorting` ref bound to `UTable` via `v-model:sorting`

- [ ] **Step 1: Bind local sorting state on the orders table**

In `app/pages/orders/index.vue` script:

```ts
import type { SortingState } from '@tanstack/vue-table';

const sorting = ref<SortingState>([]);
```

Update the table:

```vue
<UTable
	v-if="!initialize && !loading"
	v-model:sorting="sorting"
	:data="orders"
	:columns="visibleColumns"
	@select="selectOrder"
>
```

Do not change `getOrders`, pagination, export, or store `$orderby`.

- [ ] **Step 2: Re-run focused tests**

```bash
cd /Users/szejinggo/Documents/Projects/ecommerce/wemotoo-portal
npm run test:vitest:run -- test/nuxt/z-section-filter-statuses.nuxt.spec.ts test/unit/order-columns-sorting.spec.ts
```

Expected: PASS

- [ ] **Step 3: Manual smoke checklist (if app is running)**

1. Open `/orders`.
2. Status filter shows multi-select with colored badges; selecting statuses still refetches.
3. Click Order No / Status / Net Amt headers — current page rows reorder; no network refetch required for sort-only clicks.
4. Change page — new page data appears under the server default order until a header is clicked again.

- [ ] **Step 4: Commit**

```bash
cd /Users/szejinggo/Documents/Projects/ecommerce/wemotoo-portal
git add app/pages/orders/index.vue
git commit -m "$(cat <<'EOF'
feat(orders): bind client-side table sorting state

Wire UTable v-model:sorting so order column headers sort the current page.
EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Multi-select Statuses → USelectMenu + badges via optional `getColor` | Task 1 |
| Orders page passes `getOrderStatusColor` | Task 1 |
| Preserve filter emit/store/OData behavior | Task 1 (no store changes) |
| `sortableHeaderCell` helper | Task 2 |
| Sortable columns + non-sortable index | Task 2 |
| Local `v-model:sorting` on orders `UTable` | Task 3 |
| No server `$orderby` changes | Task 3 |
| Leave `OrderStatus.vue` alone | All tasks |
| Focused tests for Statuses + column sorting | Tasks 1–2 |
