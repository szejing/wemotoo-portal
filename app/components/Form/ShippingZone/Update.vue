<template>
	<div class="w-full">
		<UForm ref="formRef" :schema="schema" :state="formState" class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6" @submit="submitForm">
			<div class="lg:col-span-9 space-y-6">
				<ZInputShippingZoneDetailsSection :state="formState" :method-options="methodOptions" code-readonly />
			</div>

			<div class="lg:col-span-3">
				<div class="lg:sticky lg:top-4">
					<FormShippingZoneReviewSummary :summary="reviewSummary" subtitle-key="components.shippingZoneForm.reviewSubtitleEdit" />
				</div>
			</div>
		</UForm>
	</div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types';
import { formatCurrency } from 'yeppi-common';
import type { z } from 'zod';
import { UpdateShippingZoneValidation } from '~/utils/schema';
import type { ShippingZonePostcodePattern } from '~/utils/types/order-fulfillment-shipping';
import type { ShippingZone } from '~/utils/types/shipping-zone';
import type { ShippingZoneFormFields } from '~/utils/types/form/shipping-zone-form';
import { parseStatesFromApi, serializeStatesForApi } from '~/utils/data/malaysia-states';

const props = defineProps<{
	zoneCode: string;
	initialZone: ShippingZone;
}>();

const { t } = useI18n();
const schema = computed(() => UpdateShippingZoneValidation(t));
type Schema = z.output<ReturnType<typeof UpdateShippingZoneValidation>>;

const zoneStore = useShippingZoneStore();
const shippingMethodStore = useShippingMethodStore();

const formRef = ref<{ submit: () => void } | null>(null);

const methodOptions = ref<{ label: string; value: string }[]>([]);

const patternsToText = (patterns: ShippingZonePostcodePattern[] | undefined) => {
	if (!patterns?.length) {
		return '';
	}
	return patterns
		.filter((p) => p.kind === 'exact')
		.map((p) => p.value)
		.join('\n');
};

const linkShippingMethodId = (l: NonNullable<ShippingZone['methods']>[number]) => {
	const raw = l.shipping_method?.id ?? (l as { shipping_method_id?: number }).shipping_method_id;
	return raw != null ? String(raw) : '';
};

const pricingFromMethodLinks = (z: ShippingZone): ShippingZoneFormFields['method_pricing'] => {
	const out: ShippingZoneFormFields['method_pricing'] = {};
	for (const l of z.methods ?? []) {
		const sid = linkShippingMethodId(l);
		if (!sid) {
			continue;
		}
		out[sid] = {
			fee: l.fee,
			estimated_days: l.estimated_days ?? undefined,
			order_cutoff_time: l.order_cutoff_time ?? undefined,
		};
	}
	return out;
};

const shippingMethodIdsFromLinks = (z: ShippingZone): string[] => (z.methods ?? []).map(linkShippingMethodId).filter((id): id is string => Boolean(id));

const applyFromZone = (z: ShippingZone) => {
	formState.code = z.code;
	formState.description = z.description ?? '';
	formState.rule = z.rule ?? 0;
	formState.is_active = z.is_active;
	formState.country_code = 'MY';
	formState.state = parseStatesFromApi(z.state);
	formState.postcodes_text = patternsToText(z.postcode_patterns);
	formState.shipping_method_ids = shippingMethodIdsFromLinks(z);
	formState.method_pricing = pricingFromMethodLinks(z);
};

const formState = reactive<ShippingZoneFormFields>({
	code: '',
	description: '',
	rule: 0,
	is_active: true,
	country_code: 'MY',
	state: [],
	postcodes_text: '',
	shipping_method_ids: [],
	method_pricing: {},
});

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
	const n = countPostcodeLines(formState.postcodes_text ?? '');
	const postcodesSummaryLabel = t('components.shippingZoneForm.reviewPostcodesCount', { count: n });

	const pricingLines =
		formState.shipping_method_ids.length === 0
			? undefined
			: formState.shipping_method_ids.map((id) => {
					const label = methodOptions.value.find((o) => o.value === id)?.label ?? id;
					const row = formState.method_pricing[id];
					const feeStr = row != null && !Number.isNaN(row.fee) ? formatCurrency(Number(row.fee), currencyCode) : t('common.notSet');
					const d = row?.estimated_days;
					const daysStr = d != null && !Number.isNaN(d) ? t('components.shippingZoneForm.reviewDaysSuffix', { days: d }) : '';
					const cutoffStr = row?.order_cutoff_time ? ` ${t('components.shippingZoneForm.reviewCutoffSuffix', { time: row.order_cutoff_time })}` : '';
					return `${label}: ${feeStr}${daysStr ? ` ${daysStr}` : ''}${cutoffStr}`;
				});

	const pricingSummaryLabel = !pricingLines?.length ? t('common.notSet') : pricingLines.join(' · ');

	const methodLabelsResolved = formState.shipping_method_ids.map((id) => methodOptions.value.find((o) => o.value === id)?.label).filter((x): x is string => Boolean(x));
	const methodLabels = methodLabelsResolved.length ? methodLabelsResolved : undefined;

	return {
		code: formState.code.trim(),
		description: formState.description.trim(),
		rule: Number(formState.rule) || 0,
		statusLabel: t(formState.is_active ? 'common.active' : 'common.inactive'),
		countryLabel: formState.country_code.trim().toUpperCase(),
		stateLabel: formState.state.length ? formState.state.join(', ') : '',
		postcodesSummaryLabel,
		pricingSummaryLabel,
		pricingLines,
		methodsLabel: methodsSummaryLabel(formState.shipping_method_ids, methodOptions.value),
		methodLabels,
	};
});

watch(
	() => props.initialZone,
	(z) => {
		if (z) {
			applyFromZone(z);
		}
	},
	{ immediate: true },
);

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
	const serializedState = serializeStatesForApi(data.state);

	const payload = {
		code: props.zoneCode.trim(),
		description: data.description.trim() || undefined,
		rule: data.rule ?? 0,
		is_active: data.is_active,
		country_code: 'MY',
		state: serializedState === undefined ? null : serializedState,
		postcode_patterns: buildPostcodePatterns(data.postcodes_text ?? ''),
		methods,
		shipping_method_ids: [...data.shipping_method_ids],
	};

	const success = await zoneStore.updateShippingZone(props.zoneCode, payload);

	if (success) {
		// const product = await productStore.getProduct(formState.value.code!);
		// productStore.current_product = product;

		navigateTo(`/settings/shipping/zones`);
	}
};

const submit = () => {
	formRef.value?.submit();
};

defineExpose({ submit });

onMounted(async () => {
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
