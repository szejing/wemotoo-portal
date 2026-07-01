import HttpFactory from '~/repository/factory';
import MerchantRoutes from '~/repository/routes.client';
import type { CreateProductReq } from './models/request/create-product.req';
import type { ProductReq } from './models/request/product.req';
import type { UpdateProductReq } from './models/request/update-product.req';
import type { CreateProductResp } from './models/response/create-product.resp';
import type { ProductResp } from './models/response/product.resp';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { BaseODataResp } from '~/repository/base/base.resp';
import type { Product } from '~/utils/types/product';

const PRODUCT_IMPORT_ALLOWED_EXTENSIONS = ['.csv', '.xlsx'] as const;

export const PRODUCT_IMPORT_ACCEPT = '.csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const PRODUCT_IMPORT_FORMAT_ERROR_MESSAGE = 'Unsupported product import file format. Allowed: CSV, XLSX';

export type ProductImportResp = {
	total: number;
	created: number;
	updated: number;
	failed: number;
	errors: Array<{
		row: number;
		code?: string;
		message: string;
	}>;
};

export function isAllowedProductImportFile(file: File): boolean {
	const filename = file.name.toLowerCase();
	return PRODUCT_IMPORT_ALLOWED_EXTENSIONS.some((extension) => filename.endsWith(extension));
}

function assertAllowedProductImportFormat(file: File): void {
	if (!isAllowedProductImportFile(file)) {
		throw new Error(PRODUCT_IMPORT_FORMAT_ERROR_MESSAGE);
	}
}

class ProductModule extends HttpFactory {
	private RESOURCE = MerchantRoutes.Products;

	async getMany(query: BaseODataReq): Promise<BaseODataResp<Product>> {
		return await this.call<BaseODataResp<Product>>({
			method: 'GET',
			url: `${this.RESOURCE.Many()}`,
			query,
		});
	}

	async getSingle(code: string): Promise<ProductResp> {
		return await this.call<ProductResp>({
			method: 'GET',
			url: `${this.RESOURCE.Single(code)}`,
		});
	}

	async create(product: CreateProductReq): Promise<CreateProductResp> {
		return await this.call<CreateProductResp>({
			method: 'POST',
			url: `${this.RESOURCE.Create()}`,
			body: product,
		});
	}

	async update(code: string, product: UpdateProductReq): Promise<ProductResp> {
		return await this.call<ProductResp>({
			method: 'PATCH',
			url: `${this.RESOURCE.Update(code)}`,
			body: product,
		});
	}

	async delete(product: ProductReq): Promise<ProductResp> {
		return await this.call<ProductResp>({
			method: 'DELETE',
			url: `${this.RESOURCE.Delete(product.code)}`,
		});
	}

	async deleteVariant(code: string, variant_code: string): Promise<ProductResp> {
		return await this.call<ProductResp>({
			method: 'DELETE',
			url: `${this.RESOURCE.DeleteVariant(code, variant_code)}`,
		});
	}

	async restore(product: ProductReq): Promise<ProductResp> {
		return await this.call<ProductResp>({
			method: 'PATCH',
			url: `${this.RESOURCE.Restore(product.code)}`,
		});
	}

	async importProducts(file: File): Promise<ProductImportResp> {
		assertAllowedProductImportFormat(file);

		const formData = new FormData();
		formData.append('file', file);

		return await this.call<ProductImportResp>({
			method: 'POST',
			url: `${this.RESOURCE.Import()}`,
			body: formData,
		});
	}

	async downloadImportTemplate(): Promise<Blob> {
		return await this.call<Blob>({
			method: 'GET',
			url: `${this.RESOURCE.ImportTemplate()}`,
			fetchOptions: {
				responseType: 'blob',
			},
		});
	}
}

export default ProductModule;
