<template>
	<div class="w-full min-w-80 sm:min-w-md lg:min-w-xl">
		<div class="flex flex-col gap-3 mb-3">
			<!-- Customer Search -->
			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('components.filter.searchLabel') }}</label>
				<UInput
					v-model="filter.query"
					:placeholder="$t('components.filter.searchByNamePhoneEmail')"
					:icon="ICONS.SEARCH_ROUNDED"
					class="w-full"
					@input="debouncedSearch"
				/>
			</div>

			<!-- Actions -->
			<div class="flex gap-2">
				<UButton variant="outline" color="neutral" :disabled="loading" @click="clearFilters">
					<UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
					{{ $t('components.filter.clear') }}
				</UButton>
				<UButton color="primary" :disabled="loading" :loading="loading" @click="search">
					<UIcon :name="ICONS.SEARCH_ROUNDED" class="w-4 h-4" />
					{{ $t('components.filter.search') }}
				</UButton>
			</div>
		</div>

		<!-- Active Filters Display -->
		<div v-if="hasActiveFilters" class="flex flex-wrap gap-2 items-center">
			<span class="text-xs text-gray-600 dark:text-gray-400">{{ $t('components.filter.activeFilters') }}</span>
			<UBadge v-if="filter.query" color="info" variant="subtle" size="sm" @click="clearFilter('query')">
				{{ $t('components.filter.search') }}: {{ filter.query }}
				<UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1 cursor-pointer" />
			</UBadge>
		</div>
	</div>
</template>

<script lang="ts" setup>
const customerStore = useCustomerStore();
const { filter, loading } = storeToRefs(customerStore);

const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

const hasActiveFilters = computed(() => {
	return !!filter.value.query;
});

const search = async () => {
	await customerStore.getCustomers();
};

const debouncedSearch = () => {
	if (searchTimeout.value) {
		clearTimeout(searchTimeout.value);
	}
	searchTimeout.value = setTimeout(async () => {
		await search();
	}, 500);
};

const clearFilters = async () => {
	filter.value.query = '';
	filter.value.current_page = 1;
	await search();
};

const clearFilter = async (filterKey: string) => {
	if (filterKey === 'query') {
		filter.value.query = '';
	}
	await search();
};

onUnmounted(() => {
	if (searchTimeout.value) {
		clearTimeout(searchTimeout.value);
	}
});
</script>

<style scoped></style>
