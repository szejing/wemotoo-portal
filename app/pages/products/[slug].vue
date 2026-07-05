<template>
	<ZPagePanel id="product-detail" :title="`${$t('pages.productDetail')} #${current_product?.code ?? slug}`" back-to="/products" grow>
		<div class="container w-full mx-auto">
			<FormProductUpdateLoading v-if="isLoading" />
			<FormProductUpdate v-else-if="current_product" ref="formRef" :product="current_product" />
		</div>

		<template #footer>
			<div v-if="current_product" class="w-full backdrop-blur-sm border-t border-neutral-200 shadow-md z-50">
				<div class="mx-auto px-4 sm:px-6 py-4">
					<!-- Desktop Layout -->
					<div class="hidden md:flex justify-between items-center gap-3">
						<UButton color="error" variant="ghost" size="lg" :loading="updating" class="opacity-50 hover:opacity-100 cursor-pointer" @click="deleteProduct">
							<UIcon :name="ICONS.TRASH" />
							{{ $t('common.delete') }}
						</UButton>

						<div class="flex gap-3">
							<UButton color="neutral" variant="outline" size="lg" class="cursor-pointer" @click="cancel">{{ $t('common.cancel') }}</UButton>

							<UButton color="success" variant="solid" size="lg" :loading="updating" class="cursor-pointer" @click="updateProduct">
								<UIcon :name="ICONS.CHECK_ROUNDED" />
								{{ $t('pages.updateProduct') }}
							</UButton>
						</div>
					</div>

					<!-- Mobile Layout -->
					<div class="md:hidden flex flex-col gap-2">
						<UButton color="success" size="md" class="w-full opacity-50 hover:opacity-100 cursor-pointer" :loading="updating" @click="updateProduct">
							<UIcon :name="ICONS.CHECK_ROUNDED" />
							<span class="text-sm">{{ $t('pages.updateProduct') }}</span>
						</UButton>
						<div class="flex gap-2">
							<UButton
								color="error"
								variant="ghost"
								size="sm"
								class="flex-1 opacity-50 hover:opacity-100 cursor-pointer"
								:loading="updating"
								@click="deleteProduct"
							>
								<UIcon :name="ICONS.SAVE" class="w-4 h-4" />
								<span class="text-xs">{{ $t('common.delete') }}</span>
							</UButton>
							<UButton color="neutral" variant="outline" size="sm" class="flex-1 cursor-pointer" @click="cancel">
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

definePageMeta({ middleware: 'product-detail' });

const route = useRoute();
const slug = route.params.slug as string;

const overlay = useOverlay();
const productStore = useProductStore();
const { updating, current_product } = storeToRefs(productStore);
const formRef = ref<{ submit: () => void } | null>(null);

const isLoading = ref(!current_product.value);

const { t } = useI18n();
useHead({ title: () => t('pages.productDetailTitle') + (current_product.value?.code ?? slug) });

onBeforeRouteLeave(() => {
	current_product.value = undefined;
});

onBeforeMount(async () => {
	if (!current_product.value) {
		const product = await productStore.getProductBySlug(slug);

		if (product) {
			productStore.current_product = product;
		} else {
			await navigateTo('/products/listing');
		}
		isLoading.value = false;
	} else {
		isLoading.value = false;
	}
});

const updateProduct = () => {
	formRef.value?.submit();
};

const cancel = () => {
	useRouter().back();
};

const deleteProduct = async () => {
	const confirmModal = overlay.create(ZModalConfirmation, {
		props: {
			message: t('pages.confirmDeleteProduct'),
			action: 'delete',
			onConfirm: async () => {
				await productStore.deleteProduct(current_product.value!.code!);
				confirmModal.close();
				navigateTo(`/products/listing`);
			},
			onCancel: () => {
				confirmModal.close();
			},
		},
	});

	confirmModal.open();
};
</script>

<style scoped></style>
