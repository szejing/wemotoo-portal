<template>
	<div class="space-y-6">
		<UCard id="section-shipping-zone-details" class="shadow-md scroll-mt-4">
			<template #header>
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<div class="flex items-center gap-2">
							<UIcon :name="ICONS.LAYERS" class="text-primary-500 w-6 h-6" />
							<h2 class="text-xl font-semibold">
								{{ $t('components.shippingZoneForm.detailsTitle') }}
							</h2>
						</div>
						<p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
							{{ $t('components.shippingZoneForm.detailsSubtitle') }}
						</p>
					</div>
				</div>
			</template>

			<div class="space-y-6 py-2 px-4">
				<div class="w-full flex flex-wrap items-center gap-4 justify-end">
					<!-- <UFormField name="status" :label="$t('components.selectMenu.selectProductStatus')" class="min-w-0 flex-1 sm:flex-initial">
						<ZSelectMenuProductStatus v-model:status="state.status" />
					</UFormField> -->
					<UFormField name="is_active">
						<p class="text-xs text-neutral-500 dark:text-neutral-400 my-1">
							{{ $t('components.shippingZoneForm.fieldHints.status') }}
						</p>
						<USwitch v-model="state.is_active" :label="$t(state.is_active ? 'common.active' : 'common.inactive')" />
					</UFormField>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<UFormField name="code" :label="$t('common.code')">
						<p class="text-xs text-neutral-500 dark:text-neutral-400 my-1">
							{{ $t('components.shippingZoneForm.fieldHints.code') }}
						</p>
						<UInput
							:model-value="state.code"
							maxlength="32"
							:disabled="codeReadonly"
							:class="codeForceUppercase ? 'uppercase' : undefined"
							@update:model-value="onCodeModelUpdate"
						/>
					</UFormField>

					<UFormField name="description" :label="$t('common.description')">
						<p class="text-xs text-neutral-500 dark:text-neutral-400 my-1">
							{{ $t('components.shippingZoneForm.fieldHints.description') }}
						</p>
						<UInput v-model="state.description" />
					</UFormField>
				</div>

				<!-- <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<UFormField name="rule" :label="$t('pages.shippingZoneRule')">
						<p class="text-xs text-neutral-500 dark:text-neutral-400 my-1">{{ $t('components.shippingZoneForm.fieldHints.rule') }}</p>
						<UInput v-model.number="state.rule" type="number" min="0" step="1" />
					</UFormField>
				</div> -->

				<div v-if="SHIPPING_ZONE_SHOW_COUNTRY_AND_POSTCODE_FIELDS" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<UFormField name="state" :label="$t('pages.shippingZoneState')">
						<p class="text-xs text-neutral-500 dark:text-neutral-400 my-1">
							{{ $t('components.shippingZoneForm.fieldHints.state') }}
						</p>
						<UInput v-model="stateTextSingleMode" />
					</UFormField>
					<UFormField name="country_code" :label="$t('pages.shippingZoneCountry')">
						<p class="text-xs text-neutral-500 dark:text-neutral-400 my-1">
							{{ $t('components.shippingZoneForm.fieldHints.country') }}
						</p>
						<UInput v-model="state.country_code" maxlength="2" class="uppercase" />
					</UFormField>
				</div>

				<UFormField v-else name="state" :label="$t('pages.shippingZoneState')">
					<p class="text-xs text-neutral-500 dark:text-neutral-400 my-1">
						{{ $t('components.shippingZoneForm.fieldHints.state') }}
					</p>
					<ZSelectMenuState v-model:state-names="state.state" multiple :placeholder="$t('components.shippingZoneForm.selectStates')">
						<template #default="{ values, stateLabel, deselect, clearAll, placeholder }">
							<div v-if="values.length > 0" class="flex flex-wrap items-center gap-2">
								<div class="flex flex-wrap gap-1.5 min-w-0 flex-1">
									<UBadge v-for="st in values" :key="st" color="primary" variant="subtle" class="inline-flex max-w-[min(100%,12rem)] items-center gap-1">
										<span class="min-w-0 truncate">{{ stateLabel(st) }}</span>
										<UIcon
											:name="ICONS.CROSS"
											class="w-3.5 h-3.5 shrink-0 text-error-500 dark:text-error-400 hover:text-error-600 dark:hover:text-error-300 cursor-pointer"
											@click.stop="deselect(st)"
										/>
									</UBadge>
								</div>
							</div>
							<span v-else class="text-neutral-400 text-sm">{{ placeholder }}</span>
						</template>
					</ZSelectMenuState>
				</UFormField>

				<UFormField v-if="SHIPPING_ZONE_SHOW_COUNTRY_AND_POSTCODE_FIELDS" name="postcodes_text" :label="$t('pages.shippingZonePostcodes')">
					<p class="text-xs text-neutral-500 dark:text-neutral-400 my-1">
						{{ $t('components.shippingZoneForm.fieldHints.postcodes') }}
					</p>
					<UTextarea v-model="state.postcodes_text" :rows="3" autoresize />
				</UFormField>

				<UFormField name="shipping_method_ids" :label="$t('components.shippingZoneForm.supportedMethods')">
					<p class="text-xs text-neutral-500 dark:text-neutral-400 my-1">
						{{ $t('components.shippingZoneForm.fieldHints.supportedMethods') }}
					</p>
					<USelectMenu
						v-model="state.shipping_method_ids"
						:items="methodOptions"
						multiple
						value-key="value"
						label-key="label"
						size="md"
						:placeholder="$t('components.shippingZoneForm.selectMethods')"
						class="w-full"
					>
						<template #default>
							<div v-if="state.shipping_method_ids.length > 0" class="flex flex-wrap gap-1.5">
								<UBadge
									v-for="id in state.shipping_method_ids"
									:key="id"
									color="primary"
									variant="subtle"
									class="inline-flex max-w-[min(100%,12rem)] items-center gap-1"
								>
									<span class="min-w-0 truncate">{{ methodLabel(id) }}</span>
									<UIcon
										:name="ICONS.CROSS"
										class="w-3.5 h-3.5 shrink-0 text-error-500 dark:text-error-400 hover:text-error-600 dark:hover:text-error-300 cursor-pointer"
										@click.stop="removeMethod(id)"
									/>
								</UBadge>
							</div>
							<span v-else class="text-neutral-400 text-sm">{{ $t('components.shippingZoneForm.selectMethods') }}</span>
						</template>
					</USelectMenu>
				</UFormField>

				<div v-if="state.shipping_method_ids.length > 0" class="space-y-4">
					<h4 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
						{{ $t('components.shippingZoneForm.perMethodPricingTitle') }}
					</h4>

					<div class="flex flex-wrap items-center gap-3">
						<UInput
							v-model="applyAllFee"
							:placeholder="$t('components.variantList.pricePlaceholder')"
							type="number"
							size="sm"
							class="max-w-44"
							:ui="{ base: 'ps-12' }"
						>
							<template #leading>
								<span class="text-xs text-neutral-400">{{ props.feeCurrencyPrefix }}</span>
							</template>
						</UInput>
						<UButton color="primary" variant="soft" size="sm" @click="applyFeeToAll">
							{{ $t('components.variantList.applyToAll') }}
						</UButton>
					</div>

					<div class="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="bg-neutral-50 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-700">
								<tr>
									<th class="text-left px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
										<div class="flex items-center gap-1">
											<span class="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
											{{ $t('components.shippingZoneForm.perMethodColumnMethod') }}
										</div>
									</th>
									<th class="text-left px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
										<div class="flex items-center gap-1">
											<span class="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
											{{ $t('components.shippingZoneForm.perMethodColumnEstDays') }}
										</div>
									</th>
									<th class="text-left px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
										<div class="flex items-center gap-1">
											<span class="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
											{{ $t('components.shippingZoneForm.perMethodColumnOrderCutoff') }}
										</div>
									</th>
									<th class="text-left px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
										<span class="text-red-500">*</span>
										{{ $t('components.shippingZoneForm.perMethodColumnFee') }}
									</th>
								</tr>
							</thead>
							<tbody>
								<tr
									v-for="mid in state.shipping_method_ids"
									:key="mid"
									class="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30"
								>
									<td class="px-3 py-2 text-neutral-900 dark:text-neutral-100 font-medium align-middle">
										{{ methodLabel(mid) }}
									</td>
									<td class="px-3 py-2 align-top">
										<UFormField v-slot="{ error }" :name="`method_pricing.${mid}.estimated_days`" :label="undefined" class="[&_.ui-form-field-label]:sr-only">
											<UInput
												v-model.number="state.method_pricing[mid]!.estimated_days"
												type="number"
												min="0"
												step="1"
												size="sm"
												class="max-w-32"
												:trailing-icon="error ? ICONS.ERROR_OUTLINE : undefined"
											/>
										</UFormField>
									</td>
									<td class="px-3 py-2 align-top">
										<UFormField
											v-slot="{ error }"
											:name="`method_pricing.${mid}.order_cutoff_time`"
											:label="undefined"
											class="[&_.ui-form-field-label]:sr-only"
										>
											<UInputTime
												:model-value="parseOrderCutoffTime(state.method_pricing[mid]!.order_cutoff_time)"
												size="sm"
												class="max-w-32"
												:hour-cycle="24"
												:color="error ? 'error' : 'neutral'"
												:highlight="!!error"
												@update:model-value="(value) => setOrderCutoffTime(mid, value as OrderCutoffTimeInput)"
											/>
										</UFormField>
									</td>
									<td class="px-3 py-2 align-top">
										<UFormField v-slot="{ error }" :name="`method_pricing.${mid}.fee`" :label="undefined" class="[&_.ui-form-field-label]:sr-only">
											<UInput
												v-model.number="state.method_pricing[mid]!.fee"
												type="number"
												min="0"
												step="0.01"
												size="sm"
												class="max-w-44"
												:ui="{ base: 'ps-12' }"
												:trailing-icon="error ? ICONS.ERROR_OUTLINE : undefined"
											>
												<template #leading>
													<span class="text-xs text-neutral-400">{{ props.feeCurrencyPrefix }}</span>
												</template>
											</UInput>
										</UFormField>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script lang="ts" setup>
import { Time } from '@internationalized/date';
import { SHIPPING_ZONE_SHOW_COUNTRY_AND_POSTCODE_FIELDS } from '~/utils/data/malaysia-states';
import { ICONS } from '~/utils/icons';
import type { ShippingZoneFormFields } from '~/utils/types/form/shipping-zone-form';

const HH_MM_PATTERN = /^(\d{2}):(\d{2})$/;

function parseOrderCutoffTime(value: string | undefined): Time | null {
	if (!value?.trim()) {
		return null;
	}
	const match = HH_MM_PATTERN.exec(value.trim());
	if (!match) {
		return null;
	}
	return new Time(Number(match[1]), Number(match[2]));
}

type OrderCutoffTimeInput = { hour: number; minute: number } | null | undefined;

function formatOrderCutoffTime(value: OrderCutoffTimeInput): string | undefined {
	if (!value) {
		return undefined;
	}
	return `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`;
}

function setOrderCutoffTime(mid: string, value: OrderCutoffTimeInput) {
	const row = props.state.method_pricing[mid];
	if (!row) {
		return;
	}
	row.order_cutoff_time = formatOrderCutoffTime(value);
}

const props = withDefaults(
	defineProps<{
		state: ShippingZoneFormFields;
		methodOptions: { label: string; value: string }[];
		/** When true, zone code is display-only (e.g. edit flow). */
		codeReadonly?: boolean;
		/** When true, coerces zone code to uppercase on input (e.g. create flow). */
		codeForceUppercase?: boolean;
		/** Display prefix on fee inputs (e.g. RM). */
		feeCurrencyPrefix?: string;
	}>(),
	{ feeCurrencyPrefix: 'RM', codeReadonly: false, codeForceUppercase: false },
);

function onCodeModelUpdate(v: string) {
	props.state.code = props.codeForceUppercase ? v.toUpperCase() : v;
}

const applyAllFee = ref<number | undefined>(undefined);

function applyFeeToAll() {
	const v = applyAllFee.value;
	if (v === undefined || v === null) return;
	const n = Number(v);
	if (Number.isNaN(n)) return;
	for (const mid of props.state.shipping_method_ids) {
		const mp = props.state.method_pricing[mid];
		if (mp) mp.fee = n;
	}
}

function methodLabel(value: string): string {
	return props.methodOptions.find((o) => o.value === value)?.label ?? value;
}

function removeMethod(id: string) {
	props.state.shipping_method_ids = props.state.shipping_method_ids.filter((x) => x !== id);
	delete props.state.method_pricing[id];
}

watch(
	() => props.state.shipping_method_ids.slice(),
	(ids) => {
		const mp = props.state.method_pricing;
		for (const id of ids) {
			if (mp[id] === undefined) {
				mp[id] = {
					fee: 0,
					estimated_days: undefined,
					order_cutoff_time: undefined,
				};
			}
		}
		for (const key of Object.keys(mp)) {
			if (!ids.includes(key)) {
				delete mp[key];
			}
		}
	},
	{ deep: true },
);

/** When country/postcode fields are shown, `state` is a single free-text value in one slot. */
const stateTextSingleMode = computed({
	get() {
		return props.state.state[0] ?? '';
	},
	set(v: string) {
		const trimmed = v.trim();
		props.state.state = trimmed ? [trimmed] : [];
	},
});
</script>
