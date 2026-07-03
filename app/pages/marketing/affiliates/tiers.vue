<template>
	<ZPagePanel id="affiliate-tiers" :title="$t('affiliate.tiers')" back-to="/marketing/affiliates">
		<div class="space-y-6 max-w-3xl">
			<UCard>
				<template #header>
					<h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ $t('common.create') }} {{ $t('affiliate.tier') }}</h2>
				</template>
				<form class="space-y-4" @submit.prevent="onCreateTier">
					<UFormField :label="$t('common.name')">
						<UInput v-model="newTier.name" required />
					</UFormField>
					<UFormField :label="$t('affiliate.minReferrals')">
						<UInput v-model.number="newTier.min_referrals" type="number" min="0" required />
					</UFormField>
					<UFormField :label="$t('affiliate.commissionPercentage')">
						<UInput v-model.number="newTier.default_commission_percentage" type="number" min="0" step="0.01" required />
					</UFormField>
					<UButton type="submit" color="primary" :loading="adding">
						<UIcon v-if="!adding" :name="ICONS.ADD_OUTLINE" class="w-4 h-4" />
						{{ $t('common.create') }}
					</UButton>
				</form>
			</UCard>

			<UCard>
				<template #header>
					<h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ $t('affiliate.tiers') }}</h2>
				</template>
				<div v-if="loading" class="space-y-2">
					<USkeleton v-for="i in 3" :key="i" class="h-10 w-full" />
				</div>
				<div v-else-if="tiers.length === 0" class="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
					{{ $t('pages.noAffiliatesFound') }}
				</div>
				<div v-else class="overflow-x-auto">
					<table class="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
						<thead>
							<tr>
								<th class="px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400">{{ $t('common.name') }}</th>
								<th class="px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400">{{ $t('affiliate.minReferrals') }}</th>
								<th class="px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400">{{ $t('affiliate.commissionPercentage') }}</th>
								<th class="px-4 py-2 w-20" />
							</tr>
						</thead>
						<tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
							<tr v-for="tier in tiers" :key="tier.id">
								<td class="px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">{{ tier.name }}</td>
								<td class="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400">{{ tier.min_referrals }}</td>
								<td class="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400">{{ tier.default_commission_percentage }}</td>
								<td class="px-4 py-2">
									<UButton variant="ghost" color="error" size="xs" :loading="updating" @click="onDeleteTier(tier)">
										{{ $t('common.delete') }}
									</UButton>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</UCard>
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import type { AffiliateTier } from '~/utils/types/affiliate';
import { useAffiliateStore } from '~/stores/Affiliate/Affiliate';
import { ZModalConfirmation } from '#components';

const { t } = useI18n();
useHead({ title: () => t('affiliate.tiers') });

const affiliateStore = useAffiliateStore();
const overlay = useOverlay();
const { loading, adding, updating, tiers } = storeToRefs(affiliateStore);

const newTier = ref({
	name: '',
	min_referrals: 0,
	default_commission_percentage: 0,
});

const onCreateTier = async () => {
	const ok = await affiliateStore.createTier({
		name: newTier.value.name,
		min_referrals: newTier.value.min_referrals,
		default_commission_percentage: newTier.value.default_commission_percentage,
	});
	if (ok) {
		newTier.value = { name: '', min_referrals: 0, default_commission_percentage: 0 };
	}
};

const onDeleteTier = (tier: AffiliateTier) => {
	const confirmModal = overlay.create(ZModalConfirmation, {
		props: {
			message: t('modal.confirmationMessage'),
			action: 'delete',
			onConfirm: async () => {
				await affiliateStore.deleteTier(tier.id);
				confirmModal.close();
			},
			onCancel: () => confirmModal.close(),
		},
	});
	confirmModal.open();
};

onMounted(async () => {
	await affiliateStore.getTiers();
});
</script>
