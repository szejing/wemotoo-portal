<template>
	<div class="w-full">
		<UForm ref="formRef" :schema="schema" :state="new_shipping_zone" class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6" @submit="submitForm">
			<div class="lg:col-span-9 space-y-6">
				<ZInputShippingZoneDetailsSection :state="new_shipping_zone" :method-options="methodOptions" code-force-uppercase />
			</div>

			<div class="lg:col-span-3">
				<div class="lg:sticky lg:top-4">
					<FormShippingZoneReviewSummary :summary="reviewSummary" subtitle-key="components.shippingZoneForm.reviewSubtitleCreate" />
				</div>
			</div>
		</UForm>
	</div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types';
import { formatCurrency } from 'yeppi-common';
import type { z } from 'zod';
import { CreateShippingZoneValidation } from '~/utils/schema';
import type { ShippingZonePostcodePattern } from '~/utils/types/order-fulfillment-shipping';
import { serializeStatesForApi } from '~/utils/data/malaysia-states';

const { t } = useI18n();
const schema = computed(() => CreateShippingZoneValidation(t));
type Schema = z.output<ReturnType<typeof CreateShippingZoneValidation>>;

const zoneStore = useShippingZoneStore();
const { new_shipping_zone } = storeToRefs(zoneStore);
const shippingMethodStore = useShippingMethodStore();

const formRef = ref<{ submit: () => void } | null>(null);

const methodOptions = ref<{ label: string; value: string }[]>([]);

const currencyCode = 'MYR';

const countPostcodeLines = (text: string) =>
	text
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean).length;

const methodsSummaryLabel = (ids: string[], options: { label: string; value: string }[]) => {
	if (!ids.length) {
		return t('common.notSet');
	}
	const labels = ids.map((id) => options.find((o) => o.value === id)?.label).filter((x): x is string => Boolean(x));
	if (!labels.length) {
		return t('common.notSet');
	}
	return labels.join(', ');
};

const reviewSummary = computed(() => {
	const z = new_shipping_zone.value;
	const n = countPostcodeLines(z.postcodes_text ?? '');
	const postcodesSummaryLabel = t('components.shippingZoneForm.reviewPostcodesCount', { count: n });

	const pricingLines =
		z.shipping_method_ids.length === 0
			? undefined
			: z.shipping_method_ids.map((id) => {
					const label = methodOptions.value.find((o) => o.value === id)?.label ?? id;
					const row = z.method_pricing[id];
					const feeStr = row != null && !Number.isNaN(row.fee) ? formatCurrency(Number(row.fee), currencyCode) : t('common.notSet');
					const d = row?.estimated_days;
					const daysStr = d != null && !Number.isNaN(d) ? t('components.shippingZoneForm.reviewDaysSuffix', { days: d }) : '';
					const cutoffStr = row?.order_cutoff_time ? ` ${t('components.shippingZoneForm.reviewCutoffSuffix', { time: row.order_cutoff_time })}` : '';
					return `${label}: ${feeStr}${daysStr ? ` ${daysStr}` : ''}${cutoffStr}`;
				});

	const pricingSummaryLabel = !pricingLines?.length ? t('common.notSet') : pricingLines.join(' · ');

	const methodLabelsResolved = z.shipping_method_ids.map((id) => methodOptions.value.find((o) => o.value === id)?.label).filter((x): x is string => Boolean(x));
	const methodLabels = methodLabelsResolved.length ? methodLabelsResolved : undefined;

	return {
		code: z.code.trim(),
		description: z.description.trim(),
		rule: Number(z.rule) || 0,
		statusLabel: t(z.is_active ? 'common.active' : 'common.inactive'),
		countryLabel: z.country_code.trim().toUpperCase(),
		stateLabel: z.state.length ? z.state.join(', ') : '',
		postcodesSummaryLabel,
		pricingSummaryLabel,
		pricingLines,
		methodsLabel: methodsSummaryLabel(z.shipping_method_ids, methodOptions.value),
		methodLabels,
	};
});

const buildPostcodePatterns = (text: string): ShippingZonePostcodePattern[] => {
	return text
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.map((value) => ({ kind: 'exact' as const, value }));
};

const submitForm = async (event: FormSubmitEvent<Schema>) => {
	const data = event.data;
	const methods = data.shipping_method_ids.map((id) => ({
		shipping_method_id: Number(id),
		fee: data.method_pricing[id]?.fee ?? 0,
		estimated_days: data.method_pricing[id]?.estimated_days != null && !Number.isNaN(data.method_pricing[id]!.estimated_days!) ? data.method_pricing[id]!.estimated_days! : null,
		order_cutoff_time: data.method_pricing[id]?.order_cutoff_time || null,
	}));
	const payload = {
		code: data.code.trim().toUpperCase(),
		description: data.description.trim() || undefined,
		rule: data.rule ?? 0,
		is_active: data.is_active,
		country_code: 'MY',
		state: serializeStatesForApi(data.state),
		postcode_patterns: buildPostcodePatterns(data.postcodes_text ?? ''),
		methods,
		shipping_method_ids: [...data.shipping_method_ids],
	};

	const success = await zoneStore.createShippingZone(payload);

	if (success) {
		navigateTo(`/settings/shipping/zones`);
	}
};

const submit = () => {
	formRef.value?.submit();
};

defineExpose({ submit });

onMounted(async () => {
	zoneStore.resetNewShippingZone();
	try {
		await shippingMethodStore.getShippingMethods();
		methodOptions.value = shippingMethodStore.methods.map((m) => ({
			label: m.description,
			value: String(m.id),
		}));
	} catch {
		methodOptions.value = [];
	}
});
</script>

<style scoped>
html {
	scroll-behavior: smooth;
}

@media (max-width: 640px) {
	.space-y-6 > * + * {
		margin-top: 1.5rem;
	}
}
</style>
