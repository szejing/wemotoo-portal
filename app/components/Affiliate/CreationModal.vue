<script lang="ts" setup>
import type { BaseODataReq } from "~/repository/base/base.req";
import {
  customerToAffiliateOption,
  tierToAffiliateOption,
  type AffiliateCustomerOption,
  type AffiliateTierOption,
} from "~/utils/affiliate-create-options";
import type { Customer } from "~/utils/types/customer";
import { useAffiliateStore } from "~/stores/Affiliate/Affiliate";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  created: [];
}>();

const affiliateStore = useAffiliateStore();
const { adding, tiers } = storeToRefs(affiliateStore);

const openModel = computed({
  get() {
    return props.open;
  },
  set(value: boolean) {
    emit("update:open", value);
  },
});

const form = reactive({
  user_id: "",
  tier_id: undefined as number | undefined,
  slug: "",
});

const customers = ref<Customer[]>([]);
const customersLoading = ref(false);
const customerSearchTerm = ref("");
let searchTimer: ReturnType<typeof setTimeout> | undefined;

const customerOptions = computed<AffiliateCustomerOption[]>(() =>
  customers.value.map(customerToAffiliateOption),
);
const tierOptions = computed<AffiliateTierOption[]>(() =>
  tiers.value.map(tierToAffiliateOption),
);
const selectedCustomerOption = computed(() =>
  customerOptions.value.find((option) => option.value === form.user_id),
);
const selectedTierOption = computed(() =>
  tierOptions.value.find((option) => option.value === form.tier_id),
);

const resetForm = () => {
  form.user_id = "";
  form.tier_id = undefined;
  form.slug = "";
  customerSearchTerm.value = "";
};

const loadCustomers = async (search = "") => {
  const { $api } = useNuxtApp();
  customersLoading.value = true;
  try {
    const query: BaseODataReq = {
      $top: 25,
      $count: true,
      $skip: 0,
      $orderby: "name asc",
    };
    if (search.trim()) {
      query.$search = search.trim();
    }

    const resp = await $api.customer.getMany(query);
    customers.value =
      (resp as { data?: Customer[] }).data ??
      (resp as { value?: Customer[] }).value ??
      [];
  } catch {
    customers.value = [];
  } finally {
    customersLoading.value = false;
  }
};

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;
    await Promise.all([loadCustomers(), affiliateStore.getTiers()]);
  },
);

watch(customerSearchTerm, (term) => {
  if (!props.open) return;
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadCustomers(term);
  }, 250);
});

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
});

const onSubmit = async () => {
  const ok = await affiliateStore.createAffiliate({
    user_id: form.user_id,
    tier_id: form.tier_id,
    slug: form.slug.trim() || undefined,
  });
  if (!ok) return;

  resetForm();
  emit("created");
  openModel.value = false;
};
</script>

<template>
  <UModal
    v-model:open="openModel"
    :title="$t('affiliate.createAffiliate')"
    :ui="{ content: 'w-full sm:max-w-xl' }"
    @after:leave="resetForm"
  >
    <template #body>
      <UForm :state="form" class="space-y-4" @submit="onSubmit">
        <UFormField :label="$t('affiliate.customer')" name="user_id" required>
          <USelectMenu
            v-model="form.user_id"
            v-model:search-term="customerSearchTerm"
            :items="customerOptions"
            value-key="value"
            :loading="customersLoading"
            :search-input="{
              placeholder: $t('affiliate.searchCustomers'),
              icon: 'i-lucide-search',
            }"
            class="w-full"
          >
            <template #default>
              <div v-if="selectedCustomerOption" class="min-w-0 text-left">
                <p class="truncate text-sm font-medium text-default">
                  {{ selectedCustomerOption.label }}
                </p>
                <p class="truncate text-xs text-muted">
                  {{ selectedCustomerOption.description }}
                </p>
              </div>
              <span v-else class="text-sm text-muted">{{
                $t("affiliate.selectCustomer")
              }}</span>
            </template>

            <template #item="{ item }">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-default">
                  {{ item.label }}
                </p>
                <p class="truncate text-xs text-muted">
                  {{ item.description }}
                </p>
              </div>
            </template>

            <template #empty>
              <span class="text-sm text-muted">{{
                $t("pages.noCustomersFound")
              }}</span>
            </template>
          </USelectMenu>
        </UFormField>

        <UFormField :label="$t('affiliate.tier')" name="tier_id">
          <div class="flex items-center gap-2">
            <USelectMenu
              v-model="form.tier_id"
              :items="tierOptions"
              value-key="value"
              class="min-w-0 flex-1"
            >
              <template #default>
                <div v-if="selectedTierOption" class="min-w-0 text-left">
                  <p class="truncate text-sm font-medium text-default">
                    {{ selectedTierOption.label }}
                  </p>
                  <p class="truncate text-xs text-muted">
                    {{ selectedTierOption.description }}
                  </p>
                </div>
                <span v-else class="text-sm text-muted">{{
                  $t("affiliate.selectTier")
                }}</span>
              </template>

              <template #item="{ item }">
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-default">
                    {{ item.label }}
                  </p>
                  <p class="truncate text-xs text-muted">
                    {{ item.description }}
                  </p>
                </div>
              </template>
            </USelectMenu>
            <UButton
              v-if="form.tier_id != null"
              type="button"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              :aria-label="$t('affiliate.clearTier')"
              @click="form.tier_id = undefined"
            />
          </div>
        </UFormField>

        <UFormField :label="$t('affiliate.slug')" name="slug">
          <UInput
            v-model="form.slug"
            :placeholder="$t('affiliate.slugPlaceholder')"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            @click="openModel = false"
          >
            {{ $t("common.cancel") }}
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="adding"
            :disabled="!form.user_id"
          >
            {{ $t("affiliate.createAffiliate") }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
