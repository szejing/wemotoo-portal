import type { Product } from '~/utils/types/product';
import type { ProductUpdate } from '~/utils/types/form/product-creation';
import type { MerchantProductTypeLike } from '~/utils/product-type-resolve';
import { merchantTypeIdForKind } from '~/utils/product-type-resolve';

/** Transform Product (with populated relations) to ProductUpdate for API. */
export function transformProductToUpdate(
	product: Product,
	prodTypes: MerchantProductTypeLike[],
): ProductUpdate {
	if (!product) {
		throw new Error('Product is required for transformation');
	}
	const type_id = merchantTypeIdForKind(product.type, prodTypes);

	return {
		code: product.code,
		slug: product.slug,
		name: product.name,
		short_desc: product.short_desc,
		long_desc: product.long_desc,
		is_discountable: product.is_discountable,
		is_giftcard: product.is_giftcard,
		is_active: product.is_active,
		status: product.status,
		type_id,
		category_codes:
			product.categories
				?.filter((cat) => cat != null && cat.code != null)
				.map((cat) => cat.code!)
				.filter((code): code is string => code != null) ?? [],
		tag_ids:
			product.tags
				?.filter((tag) => tag != null && tag.id != null)
				.map((tag) => tag.id!)
				.filter((id): id is number => id != null) ?? undefined,
		brand_codes:
			product.brands
				?.filter((brand) => brand != null && brand.code != null)
				.map((brand) => brand.code!)
				.filter((code): code is string => code != null) ?? undefined,
		price_types:
			product.price_types
				?.filter((price) => price != null)
				.map((price) => ({
					id: price.id,
					currency_code: price.currency_code,
					orig_sell_price: price.orig_sell_price,
					cost_price: price.cost_price,
					sale_price: price.sale_price,
				})) ?? [],
		variations:
			product.variations
				?.filter((variation) => variation != null)
				.map((variation) => ({
					id: variation.id,
					name: variation.name,
					options:
						variation.options
							?.filter((option) => option != null)
							.map((option) => ({
								id: option.id,
								variation_id: option.variation_id,
								value: option.value,
							})) ?? [],
				})) ?? [],
		variants:
			product.variants
				?.filter((variant) => variant != null)
				.map((variant) => ({
					variant_code: variant.variant_code,
					product_code: variant.product_code,
					name: variant.name,
					sku: variant.sku,
					ean: variant.ean,
					upc: variant.upc,
					barcode: variant.barcode,
					hs_code: variant.hs_code,
					inventory_quantity: variant.inventory_quantity,
					allow_backorder: variant.allow_backorder,
					manage_inventory: variant.manage_inventory,
					weight: variant.weight,
					length: variant.length,
					height: variant.height,
					width: variant.width,
					origin_country: variant.origin_country,
					material: variant.material,
					price_types:
						variant.price_types
							?.filter((price) => price != null)
							.map((price) => ({
								id: price.id,
								currency_code: price.currency_code,
								orig_sell_price: price.orig_sell_price,
								cost_price: price.cost_price,
								sale_price: price.sale_price,
							})) ?? [],
					options:
						variant.options
							?.filter((option) => option != null)
							.map((option) => ({
								id: option.id,
								option_id: option.variation_id,
								value: option.value,
							})) ?? [],
					metadata: variant.metadata,
				})) ?? [],
		thumbnail: product.thumbnail,
		images: product.images,
		metadata: product.metadata,
	};
}
