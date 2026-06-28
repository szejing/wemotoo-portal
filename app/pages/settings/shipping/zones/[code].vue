<template>
	<ZPagePanel id="shipping-zone-edit" :title="panelTitle" back-to="/settings/shipping/zones" grow>
		<div class="container w-full mx-auto">
			<FormShippingZoneUpdateLoading v-if="isLoading" />
			<FormShippingZoneUpdate
				v-else-if="current_shipping_zone"
				:key="current_shipping_zone.code"
				ref="formRef"
				:zone-code="current_shipping_zone.code"
				:initial-zone="current_shipping_zone"
			/>
		</div>

		<template #footer>
			<div v-if="current_shipping_zone" class="w-full backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-800 shadow-md z-50">
				<div class="mx-auto px-4 sm:px-6 py-4">
					<div class="hidden md:flex justify-between items-center gap-3">
						<UButton color="error" variant="ghost" size="lg" :loading="removing" @click="confirmDelete">
							<UIcon :name="ICONS.TRASH" />
							{{ $t('common.delete') }}
						</UButton>
						<div class="flex gap-3">
							<UButton color="neutral" variant="outline" size="lg" @click="goBack">{{ $t('common.cancel') }}</UButton>
							<UButton color="success" variant="solid" size="lg" :loading="updating" @click="onSubmit">
								<UIcon :name="ICONS.CHECK_ROUNDED" />
								{{ $t('common.save') }}
							</UButton>
						</div>
					</div>
					<div class="md:hidden flex flex-col gap-2">
						<UButton color="success" size="md" class="w-full" :loading="updating" @click="onSubmit">
							<UIcon :name="ICONS.CHECK_ROUNDED" class="w-4 h-4" />
							<span class="text-sm">{{ $t('common.save') }}</span>
						</UButton>
						<div class="flex gap-2">
							<UButton color="error" variant="ghost" size="sm" class="flex-1" :loading="removing" @click="confirmDelete">
								<UIcon :name="ICONS.TRASH" class="w-4 h-4" />
								<span class="text-xs">{{ $t('common.delete') }}</span>
							</UButton>
							<UButton color="neutral" variant="outline" size="sm" class="flex-1" @click="goBack">
								<span class="text-xs">{{ $t('common.cancel') }}</span>
							</UButton>
						</div>
					</div>
				</div>
			</div>
		</template>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { ZModalConfirmation } from '#components';
import { ICONS } from '~/utils/icons';

const route = useRoute();
const code = computed(() => route.params.code as string);

const overlay = useOverlay();
const { t } = useI18n();
const shippingZoneStore = useShippingZoneStore();
const { updating, removing, current_shipping_zone } = storeToRefs(shippingZoneStore);
const formRef = ref<{ submit: () => void } | null>(null);

const isLoading = ref(true);

const panelTitle = computed(() => {
	const label = current_shipping_zone.value?.description || current_shipping_zone.value?.code;
	if (label) {
		return `${t('pages.editShippingZoneTitle')}: ${label}`;
	}
	return t('pages.editShippingZoneTitle');
});

useHead({
	title: () =>
		current_shipping_zone.value
			? `${t('pages.editShippingZonePageTitle')} — ${current_shipping_zone.value.description || current_shipping_zone.value.code}`
			: t('pages.editShippingZonePageTitle'),
});

onMounted(async () => {
	isLoading.value = true;
	try {
		const zone = await shippingZoneStore.getShippingZone(String(code.value));
		if (zone) {
			shippingZoneStore.current_shipping_zone = zone;
		} else {
			await navigateTo('/settings/shipping/zones');
		}
	} finally {
		isLoading.value = false;
	}
});

const onSubmit = () => {
	formRef.value?.submit();
};

const goBack = () => {
	useRouter().back();
};

const confirmDelete = () => {
	if (!current_shipping_zone.value) {
		return;
	}

	const zoneKey = current_shipping_zone.value.code;

	const confirmModal = overlay.create(ZModalConfirmation, {
		props: {
			message: t('components.shippingZone.confirmDelete'),
			action: 'delete',
			onConfirm: async () => {
				await shippingZoneStore.deleteShippingZone(zoneKey);
				confirmModal.close();
				await navigateTo('/settings/shipping/zones');
			},
			onCancel: () => {
				confirmModal.close();
			},
		},
	});

	confirmModal.open();
};
</script>
