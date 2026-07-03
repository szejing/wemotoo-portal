<template>
	<ZPagePanel id="affiliate-detail" :title="pageTitle" back-to="/marketing/affiliates">
		<div v-if="loading && !current_affiliate" class="w-full animate-in fade-in duration-200 space-y-6 max-w-3xl">
			<div class="space-y-4">
				<USkeleton class="h-8 w-48" />
				<USkeleton class="h-4 w-full" />
				<USkeleton class="h-4 w-full" />
			</div>
		</div>

		<div v-else-if="current_affiliate" class="space-y-6 max-w-3xl">
			<UCard>
				<template #header>
					<h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
						{{ $t('nav.affiliates') }} - {{ current_affiliate.slug }}
					</h2>
				</template>
				<dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">{{ $t('affiliate.slug') }}</dt>
						<dd class="mt-1 text-sm text-neutral-900 dark:text-neutral-100">{{ current_affiliate.slug }}</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">User ID</dt>
						<dd class="mt-1 text-sm text-neutral-900 dark:text-neutral-100">{{ current_affiliate.user_id }}</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">{{ $t('affiliate.tier') }}</dt>
						<dd class="mt-1 text-sm text-neutral-900 dark:text-neutral-100">{{ current_affiliate.tier?.name ?? '—' }}</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">{{ $t('affiliate.referrals') }}</dt>
						<dd class="mt-1 text-sm text-neutral-900 dark:text-neutral-100">{{ current_affiliate.total_referrals_count ?? 0 }}</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">{{ $t('affiliate.balance') }}</dt>
						<dd class="mt-1 text-sm text-neutral-900 dark:text-neutral-100">{{ current_affiliate.current_balance ?? 0 }}</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">{{ $t('affiliate.createdAt') }}</dt>
						<dd class="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
							{{ current_affiliate.created_at ? new Date(current_affiliate.created_at).toLocaleString() : '—' }}
						</dd>
					</div>
				</dl>
			</UCard>
		</div>
		<div v-else class="text-sm text-neutral-600 dark:text-neutral-400">
			{{ $t('pages.noAffiliatesFound') }}
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { useAffiliateStore } from '~/stores/Affiliate/Affiliate';

const route = useRoute();
const id = computed(() => String(route.params.id ?? ''));
const affiliateStore = useAffiliateStore();
const { loading, current_affiliate } = storeToRefs(affiliateStore);

const { t } = useI18n();
const pageTitle = computed(() => {
	if (!current_affiliate.value) return t('nav.affiliates');
	return current_affiliate.value.slug || t('nav.affiliates');
});

useHead({ title: () => pageTitle.value });

onMounted(async () => {
	if (id.value) {
		await affiliateStore.getAffiliateById(id.value);
	}
});
</script>
