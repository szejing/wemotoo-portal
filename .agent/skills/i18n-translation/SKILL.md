---
name: i18n-translation
description: Translate UI strings, validation messages, and options in the Wemotoo CRM Portal (Nuxt/Vue). Use when adding i18n support, translating pages/components, or when the user mentions translation, localization, multi-language, Bahasa Melayu, or locale files.
---

# i18n Translation for Wemotoo CRM Portal

This skill guides translation of UI strings, validation messages, and option labels in the Wemotoo CRM Portal using `@nuxtjs/i18n`.

## Project Setup

**Languages**: English (default) and Bahasa Melayu (ms)  
**Locale files**: `i18n/locales/en.json` and `i18n/locales/ms.json`  
**Configuration**: `nuxt.config.ts` configured with `@nuxtjs/i18n` module  
**Persistence**: `localStorage` via `app/plugins/00.locale-persistence.client.ts`

## Locale File Structure

```json
{
	"common": { "appName": "...", "save": "...", "cancel": "..." },
	"nav": { "dashboard": "...", "orders": "..." },
	"auth": { "loginTitle": "...", "email": "..." },
	"validation": {
		"auth": { "emailRequired": "...", "passwordMin6": "..." },
		"product": { "codeRequired": "...", "nameRequired": "..." },
		"tax": { "taxCodeRequired": "..." }
	},
	"pages": { "ordersTitle": "...", "noOrdersFound": "..." },
	"table": { "code": "...", "name": "...", "status": "..." },
	"options": { "all": "All", "pending": "Pending", "completed": "Completed" },
	"modal": { "confirmationTitle": "...", "confirmationMessage": "..." },
	"components": {
		"backButton": { "backToPreviousPage": "..." },
		"orderDetail": { "customerInformation": "...", "edit": "..." }
	}
}
```

## Translation Patterns

### 1. Vue Templates

Use `$t()` for direct interpolation:

```vue
<template>
	<h1>{{ $t('pages.ordersTitle') }}</h1>
	<UButton>{{ $t('common.save') }}</UButton>
	<p>{{ $t('pages.showingToOf', { from: 1, to: 10, total: 100 }) }}</p>
</template>
```

### 2. Script Setup

Use `useI18n()` composable:

```vue
<script setup lang="ts">
const { t } = useI18n();
useHead({ title: () => t('pages.ordersTitle') });

const message = computed(() => t('pages.noOrdersFound'));
</script>
```

### 3. Validation Schemas (Zod)

**Pattern**: Export an i18n-enabled `createXxxValidation(t: TranslateFn)` factory. Keep deprecated static schemas only when existing imports still require backwards compatibility.

```typescript
// app/utils/schema/Tax/Create/TaxValidation.ts
import { z } from 'zod';
import type { TranslateFn } from '../../Auth/LoginValidation';

export function createCreateTaxValidation(t: TranslateFn) {
	return z.object({
		code: z.string({ message: t('validation.tax.taxCodeRequired') }).min(1),
		description: z.string({ message: t('validation.tax.taxDescriptionRequired') }),
	});
}

/** @deprecated Existing compatibility only. New code should use createCreateTaxValidation(t). */
export const CreateTaxValidation = z.object({
	code: z.string({ message: 'Tax code is required' }).min(1),
	description: z.string({ message: 'Tax description is required' }),
});
```

**Consumer**:

```vue
<script setup lang="ts">
import { createCreateTaxValidation } from '~/utils/schema';

const { t } = useI18n();
const taxSchema = computed(() => createCreateTaxValidation(t));

type Schema = z.output<ReturnType<typeof createCreateTaxValidation>>;
</script>

<template>
	<UForm :schema="taxSchema" :state="formState" @submit="onSubmit">
		<!-- form fields -->
	</UForm>
</template>
```

**Export in index.ts**:

```typescript
export {
	createCreateTaxValidation, // i18n-enabled
	CreateTaxValidation, // deprecated compatibility only, if existing consumers still import it
};
```

### 4. Options Arrays

**Pattern**: Export `getXxxOptions(t: TranslateFn)` function + keep existing raw array.

```typescript
// app/utils/options/order-status.ts
import { OrderStatus } from 'yeppi-common';

export type TranslateFn = (key: string) => string;

export const options_order_status = ['All', OrderStatus.PENDING_PAYMENT, OrderStatus.COMPLETED];

export function getOrderStatusOptions(t: TranslateFn) {
	return [
		{ value: 'All', label: t('options.all') },
		{ value: OrderStatus.PENDING_PAYMENT, label: t('options.pendingPayment') },
		{ value: OrderStatus.COMPLETED, label: t('options.completed') },
	];
}
```

**Export in index.ts**:

```typescript
export {
	options_order_status, // raw array
	getOrderStatusOptions, // i18n-enabled
};
```

**Consumer (SelectMenu)**:

```vue
<script setup lang="ts">
import { getOrderStatusOptions, getOrderStatusColor } from '~/utils/options';

const { t } = useI18n();
const items = computed(() => getOrderStatusOptions(t));
const selectedLabel = computed(() => items.value.find((i) => i.value === status.value)?.label ?? status.value);
</script>

<template>
	<USelectMenu v-model="status" :items="items" value-key="value">
		<template #default>
			<UBadge :color="getOrderStatusColor(status)">
				{{ selectedLabel }}
			</UBadge>
		</template>
		<template #item="{ item }">
			<UBadge :color="getOrderStatusColor(item.value)">
				{{ item.label }}
			</UBadge>
		</template>
	</USelectMenu>
</template>
```

### 5. Table Columns

**Pattern**: Export `getXxxColumns(t: TranslateFn)` function.

```typescript
// app/utils/table-columns/order.ts
import type { TranslateFn } from '../options/order-status';

export function getOrderColumns(t: TranslateFn) {
	return [
		{ key: 'order_no', label: t('table.orderNo') },
		{ key: 'customer_name', label: t('table.customer') },
		{ key: 'status', label: t('table.status') },
	];
}
```

**Consumer**:

```vue
<script setup lang="ts">
import { getOrderColumns } from '~/utils/table-columns';

const { t } = useI18n();
const columns = computed(() => getOrderColumns(t));
</script>

<template>
	<UTable :data="rows" :columns="columns" />
</template>
```

## Translation Workflow

### Step 1: Add locale keys

Add keys to both `i18n/locales/en.json` and `i18n/locales/ms.json`:

```json
// en.json
{
  "pages": {
    "noOrdersFound": "No orders found.",
    "tryAdjustingFilters": "Try adjusting your filters to see more results."
  }
}

// ms.json
{
  "pages": {
    "noOrdersFound": "Tiada pesanan dijumpai.",
    "tryAdjustingFilters": "Cuba laraskan penapis anda untuk lebih hasil."
  }
}
```

### Step 2: Replace hardcoded strings

**Templates**:

```vue
<!-- Before -->
<p>No orders found.</p>

<!-- After -->
<p>{{ $t('pages.noOrdersFound') }}</p>
```

**Scripts**:

```typescript
// Before
successNotification('Order updated successfully');

// After
const { t } = useI18n();
successNotification(t('notifications.orderUpdateSuccess'));
```

### Step 3: Update schemas/options (if needed)

Follow patterns in section "Translation Patterns" above.

### Step 4: Test

Switch language and verify all strings are translated.

## Special Cases

### Pluralization

Use pipe syntax with `{n}`:

```json
{
	"appointmentsCount": "{n} appointment | {n} appointments"
}
```

Usage: `$t('pages.appointmentsCount', count)` (count as second argument)

### Interpolation

Use `{varName}` placeholders:

```json
{
	"showingToOf": "Showing {from} to {to} of {total} results"
}
```

Usage: `$t('pages.showingToOf', { from: 1, to: 10, total: 100 })`

### Special Characters

Escape `@` in email placeholders:

```json
{
	"emailPlaceholder": "you{'@'}example.com"
}
```

## Naming Conventions

| Category       | Key pattern                         | Example                                |
| -------------- | ----------------------------------- | -------------------------------------- |
| Empty states   | `no{Entity}Found`                   | `noOrdersFound`, `noProductsFound`     |
| Buttons        | `{action}{Entity}`                  | `createProduct`, `updateOrderStatus`   |
| Labels         | `{field}Label`                      | `ordersLabel`, `totalLabel`            |
| Common actions | In `common.*`                       | `save`, `cancel`, `edit`, `delete`     |
| Validation     | `validation.{entity}.{field}{Rule}` | `validation.tax.taxCodeRequired`       |
| Options        | `options.{status}`                  | `options.pending`, `options.completed` |

## Common Keys Reference

**common**: `save`, `cancel`, `submit`, `edit`, `delete`, `show`, `entries`, `export`, `details`, `status`, `active`, `inactive`

**pages**: `noXxxFound`, `tryAdjustingFilters`, `tryAdjustingSearch`, `showingToOf`, `totalLabel`

**options**: `all`, `pending`, `completed`, `cancelled`, `active`, `inactive`, `draft`, `published`

## Best Practices

1. **Reuse existing keys** – Check if a similar key exists before creating a new one
2. **Be consistent** – Use the same pattern across similar components
3. **Group logically** – Related keys should be in the same namespace (e.g., `components.orderDetail.*`)
4. **Keep it flat** – Avoid deeply nested structures (max 3 levels)
5. **Use computed** – For reactive schemas/columns, wrap in `computed()`
6. **Test both locales** – Always verify translations in both English and Bahasa Melayu

## Quick Reference

- Translate template text: `$t('namespace.key')`
- Translate in script: `const { t } = useI18n(); t('key')`
- Translate schema: export `createXxxValidation(t)`
- Translate options: export `getXxxOptions(t)` returning `{ value, label }[]`
- Translate table: export `getXxxColumns(t)`
- Add locale key: update both `en.json` and `ms.json`
- With variables: use `{varName}` in locale and pass an object as the second argument
- Pluralization: use pipe syntax with `{n}` and pass count as the second argument
