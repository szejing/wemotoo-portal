import type { ProductStatus } from 'yeppi-common';
import type { PriceInput } from '../price';
import type { ProductVariantInput } from '../product';
import type { Image } from '../image';
import type { ProductVariationInput } from '../product-variation';

export type ProductCreate = {
	code?: string;
	slug?: string;
	name?: string;
	short_desc?: string;
	long_desc?: string;
	is_discountable?: boolean;
	is_giftcard?: boolean;
	is_active?: boolean;
	status?: ProductStatus;

	// Relations (using codes/IDs)
	brand_codes?: string[]; // optional
	category_codes: string[] | undefined; // optional
	tag_ids?: number[]; // optional
	type_id: number; // item or services

	// File uploads
	thumbnail?: File | Image; // optional
	images?: File[] | Image[]; // optional

	// Nested inputs
	price_types?: PriceInput[]; // required
	variations?: ProductVariationInput[]; // mainly for items
	variants?: ProductVariantInput[]; // mainly for items

	metadata?: Record<string, unknown>;
};

export type ProductUpdate = {
	code?: string;
	slug?: string;
	name?: string;
	short_desc?: string;
	long_desc?: string;
	is_discountable?: boolean;
	is_giftcard?: boolean;
	is_active?: boolean;
	status?: ProductStatus;

	// Relations (using codes/IDs)
	brand_codes?: string[]; // optional
	category_codes?: string[]; // optional
	tag_ids?: number[]; // optional
	type_id?: number; // item or services

	// File uploads
	thumbnail?: File | Image | undefined; // optional
	images?: File[] | Image[] | undefined; // optional

	// Nested inputs
	price_types?: PriceInput[]; // required
	variations?: ProductVariationInput[]; // mainly for items
	variants?: ProductVariantInput[]; // mainly for items

	metadata?: Record<string, unknown>;
};
