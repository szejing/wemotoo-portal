import { defaultProductRelations, getFormattedDate, ProductStatus, removeDuplicateExpands } from 'yeppi-common';
import { options_page_size } from '~/utils/options';
import type { Product } from '~/utils/types/product';
import { failedNotification, successNotification } from '../AppUi/AppUi';
import type { ErrorResponse } from '~/repository/base/error';
import type { ProductCreate, ProductUpdate } from '~/utils/types/form/product-creation';
import { dir } from '~/utils/constants/dir';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { ImageReq } from '~/repository/modules/image/models/request/image.req';
import type { ProductImportResp, ProductImportTemplateType } from '~/repository/modules/product/product';

type ProductFilter = {
	query: string;
	status: ProductStatus | undefined;
	page_size: number;
	current_page: number;
};

const initialEmptyProductFilter: ProductFilter = {
	query: '',
	status: undefined,
	page_size: options_page_size[0] as number,
	current_page: 1,
};

const initialEmptyProduct: ProductCreate = {
	code: undefined,
	name: '',
	short_desc: undefined,
	long_desc: undefined,
	is_active: true,
	is_discountable: true,
	is_giftcard: false,

	status: ProductStatus.DRAFT,

	// product types
	type_id: 1,

	// categories
	category_codes: [],

	// brands
	brand_codes: [],

	// tags
	tag_ids: [],

	// thumbnail
	thumbnail: undefined,

	// images
	images: undefined,

	// price
	price_types: [
		{
			id: undefined,
			currency_code: 'MYR',
			orig_sell_price: 0,
			cost_price: undefined,
			sale_price: undefined,
		},
	],

	// variants
	variations: [],
	variants: [],

	// metadata
	metadata: undefined,
};

export const useProductStore = defineStore('productStore', {
	state: () => ({
		loading: false as boolean,
		adding: false as boolean,
		updating: false as boolean,
		exporting: false as boolean,
		importing: false as boolean,
		downloading_template: false as boolean,
		new_product: structuredClone(initialEmptyProduct),
		products: [] as Product[],
		total_products: 0 as number,
		current_product: undefined as Product | undefined,
		filter: initialEmptyProductFilter,
		errors: [] as string[],
	}),

	actions: {
		resetNewProduct() {
			this.new_product = structuredClone(initialEmptyProduct);
		},

		async updatePageSize(size: number) {
			this.filter.page_size = size;

			if (this.filter.page_size > this.products.length) {
				this.filter.current_page = 1;
				return;
			}

			this.getProducts();
		},

		async updatePage(page: number) {
			this.filter.current_page = page;

			if (this.filter.current_page < 0 || this.products.length === this.total_products) {
				return;
			}

			this.getProducts();
		},

		async getProduct(code: string): Promise<Product | undefined> {
			const { $api } = useNuxtApp();

			try {
				const data = await $api.product.getSingle(code);

				if (data.product) {
					return data.product;
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process product';
				failedNotification(message);
			}
		},

		async getProducts(): Promise<void> {
			this.loading = true;
			const { $api } = useNuxtApp();
			try {
				const { query, status } = this.filter;

				let filter = '';

				// Add status filter if provided
				if (status) {
					filter = `status eq '${status}'`;
				}

				const queryParams: BaseODataReq = {
					$top: this.filter.page_size,
					$count: true,
					$skip: (this.filter.current_page - 1) * this.filter.page_size,
					$expand: removeDuplicateExpands(defaultProductRelations).join(','),
					$orderby: 'updated_at desc',
				};

				if (filter) {
					queryParams.$filter = filter;
				}

				// Use backend $search support for text search
				if (query) {
					queryParams.$search = query;
				}

				const resp = await $api.product.getMany(queryParams);
				const items = resp.data ?? resp.value ?? [];
				const total = resp['@odata.count'] ?? resp.count ?? 0;

				this.products = Array.isArray(items) ? items : [];
				this.total_products = typeof total === 'number' ? total : 0;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process product';
				failedNotification(message);
			} finally {
				this.loading = false;
			}
		},

		async createProduct(): Promise<Product> {
			this.adding = true;

			const { $api } = useNuxtApp();

			try {
				let images: ImageReq[] = [];
				if (this.new_product.images) {
					const resp = await $api.image.uploadMultiple(this.new_product.images as File[], `${dir.products}/${this.new_product.code}`, 'product-gallery');
					images = resp.images.map((image) => ({
						id: image.id,
						url: image.url,
					}));
				}

				let thumbnail: ImageReq | undefined;
				if (this.new_product.thumbnail) {
					const resp = await $api.image.upload(this.new_product.thumbnail as File, `${dir.products}/${this.new_product.code}`, 'product-thumbnail');
					thumbnail = {
						id: resp.image.id,
						url: resp.image.url,
					};
				}

				const data = await $api.product.create({
					...this.new_product,
					images,
					thumbnail,
				});

				if (data.product) {
					successNotification(`${data.product.code} - Product Created !`);
				}

				this.resetNewProduct();
				return data.product;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process product';
				failedNotification(message);
				throw new Error(message);
			} finally {
				this.adding = false;
			}
		},

		async updateStatus(product: Product, is_active: boolean) {
			await this.updateProduct({ code: product.code as string, is_active });
		},

		async updateProduct(product: Partial<ProductUpdate> & { code: string }) {
			const code = product.code;
			this.updating = true;

			const { $api } = useNuxtApp();

			try {
				// Only resolve images when provided (partial update)
				let images: ImageReq[] | undefined;
				if (product.images !== undefined) {
					images = [];
					if (product.images.length > 0) {
						for (const [index, image] of product.images.entries()) {
							if (image instanceof File) {
								const resp = await $api.image.upload(image, `${dir.products}/${code}`, 'product-gallery', index + 1);
								images.push({ id: resp.image.id, url: resp.image.url });
							} else {
								images.push({ id: image.id, url: image.url });
							}
						}
					}
				}

				// Only resolve thumbnail when provided (partial update)
				let thumbnail: ImageReq | undefined;
				if (product.thumbnail !== undefined) {
					if (product.thumbnail) {
						if (product.thumbnail instanceof File) {
							const resp = await $api.image.upload(product.thumbnail, `${dir.products}/${code}`, 'product-thumbnail');
							thumbnail = {
								id: resp.image.id,
								url: resp.image.url,
							};
						} else {
							thumbnail = {
								id: product.thumbnail.id,
								url: product.thumbnail.url,
							};
						}
					} else {
						thumbnail = undefined;
					}
				}

				// Build payload with only defined fields (partial update: omit = no change)
				const body: Record<string, unknown> = {};
				if (product.name !== undefined) body.name = product.name;
				if (product.short_desc !== undefined) body.short_desc = product.short_desc;
				if (product.long_desc !== undefined) body.long_desc = product.long_desc;
				if (product.is_active !== undefined) body.is_active = product.is_active;
				if (product.is_discountable !== undefined) body.is_discountable = product.is_discountable;
				if (product.is_giftcard !== undefined) body.is_giftcard = product.is_giftcard;
				if (product.status !== undefined) body.status = product.status;
				if (product.type_id !== undefined) body.type_id = product.type_id;
				if (product.metadata !== undefined) body.metadata = product.metadata;
				if (product.tag_ids !== undefined) body.tag_ids = product.tag_ids;
				if (product.brand_codes !== undefined) body.brand_codes = product.brand_codes;
				if (product.category_codes !== undefined) body.category_codes = product.category_codes;
				if (product.price_types !== undefined) body.price_types = product.price_types;
				if (product.variations !== undefined) body.variations = product.variations;
				if (product.variants !== undefined) body.variants = product.variants;
				if (thumbnail !== undefined) body.thumbnail = thumbnail;
				if (images !== undefined) body.images = images;

				const data = await $api.product.update(code, body);

				if (data.product) {
					successNotification(`Product ${code} Updated !`);
					this.products = this.products.map((p) => {
						if (p.code === code) {
							return data.product;
						}
						return p;
					});
				}

				return true;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process product';
				failedNotification(message);
			} finally {
				this.updating = false;
			}
		},

		async deleteProduct(code: string) {
			this.loading = true;

			const { $api } = useNuxtApp();

			try {
				const data = await $api.product.delete({ code });

				if (data.product) {
					successNotification(`Product #${data.product.code} Deleted !`);

					const index = this.products.findIndex((t) => t.code === data.product.code);
					this.products.splice(index, 1);
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process product';
				failedNotification(message);
			} finally {
				this.loading = false;
			}
		},

		async deleteVariant(code: string, variant_code: string) {
			this.loading = true;

			const { $api } = useNuxtApp();

			try {
				const data = await $api.product.deleteVariant(code, variant_code);

				if (data.product) {
					successNotification(`Variant #${variant_code} Deleted !`);

					this.products = this.products.map((product) => {
						if (product.code === code) {
							return data.product;
						}
						return product;
					});
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process product';
				failedNotification(message);
			} finally {
				this.loading = false;
			}
		},

		async importProducts(file: File, templateType: ProductImportTemplateType = 'wemotoo'): Promise<ProductImportResp> {
			this.importing = true;

			const { $api } = useNuxtApp();

			try {
				const result = await $api.product.importProducts(file, templateType);
				const created = result.created ?? 0;
				const updated = result.updated ?? 0;
				const failed = result.failed ?? 0;

				if (failed > 0) {
					failedNotification(`Product import completed with ${failed} failed row(s)`);
				} else {
					successNotification(`Product import completed: ${created} created, ${updated} updated`);
				}

				await this.getProducts();
				return result;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? (err instanceof Error ? err.message : 'Failed to import products');
				failedNotification(message);
				throw new Error(message);
			} finally {
				this.importing = false;
			}
		},

		async downloadImportTemplate() {
			const { $api } = useNuxtApp();
			this.downloading_template = true;

			try {
				const blob = await $api.product.downloadImportTemplate();
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `product_import_template_${getFormattedDate(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
				successNotification('Product import template downloaded');
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to download product import template';
				failedNotification(message);
			} finally {
				this.downloading_template = false;
			}
		},

		async exportProducts() {
			// this.exporting = true;
			// const { $api } = useNuxtApp();
			// try {
			// 	const data = await $api.product.exportProducts();
			// } catch (err: any) {
			// 	console.error(err);
			// 	failedNotification(err.message);
			// } finally {
			// 	this.exporting = false;
			// }
		},
	},
});
