type ProductRouteSource = {
	code?: string | null;
	slug?: string | null;
};

export function productRouteSegment(product: ProductRouteSource): string {
	return product.slug?.trim() || product.code?.trim() || '';
}

export function productDetailPath(product: ProductRouteSource): string {
	return `/products/${encodeURIComponent(productRouteSegment(product))}`;
}
