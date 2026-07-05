import type { ProductStatus, ProductType as ProductKind } from 'yeppi-common';
import type { Price, PriceInput } from './price';
import type { Category } from './category';
import type { Tag } from './tag';
import type { Brand } from './brand';
import type { Image } from './image';
import type { ProductVariant } from './product-variant';
import type { ProductVariation } from './product-variation';
import type { ProductOptionInput } from './product-option';

// ============================================
// INPUT TYPES (for create/update operations)
// ============================================

// export type ProductOptionValueInput = {
// 	id?: number;
// 	option_id?: number;
// 	value: string;
// 	metadata?: Record<string, unknown>;
// };

// export type ProductOptionInput = {
// 	id?: number;
// 	name: string;
// 	values: ProductOptionValueInput[];
// 	metadata?: Record<string, unknown>;
// 	selected?: boolean;
// };

export type ProductVariantInput = {
	variant_code?: string;
	product_code?: string;
	name?: string;
	sku?: string;
	ean?: string;
	upc?: string;
	barcode?: string;
	hs_code?: string;
	inventory_quantity?: number;
	allow_backorder?: boolean;
	manage_inventory?: boolean;
	weight?: number;
	length?: number;
	height?: number;
	width?: number;
	origin_country?: string;
	material?: string;
	price_types?: PriceInput[];
	options?: ProductOptionInput[];
	metadata?: Record<string, unknown>;
};

// ============================================
// MODEL TYPES (for display/read operations)
// ============================================
// On get/retrieve, each product has at most 2 variation sets. Each variation set has:
// - id: global variation id (e.g. 1 = Size)
// - name: variation name (e.g. "Size")
// - options: scoped options for this product only (e.g. [L, XL, XXL], not the full global list)

export type Product = {
	code?: string;
	slug?: string;
	name?: string;
	short_desc?: string;
	long_desc?: string;
	is_discountable?: boolean;
	is_giftcard?: boolean;
	is_active?: boolean;
	status?: ProductStatus;

	// Relations (populated objects)
	brands?: Brand[];
	categories?: Category[];
	tags?: Tag[];
	type?: ProductKind;

	// Images (URLs from backend)
	thumbnail?: Image | undefined;
	images?: Image[] | undefined;

	// Nested models
	price_types?: Price[];
	/** Per-product variation sets: variation id/name + scoped options (max 2 per product). */
	variations?: ProductVariation[];
	variants?: ProductVariant[];

	// Timestamps
	created_at?: Date;
	updated_at: Date;

	metadata?: Record<string, unknown>;
};
