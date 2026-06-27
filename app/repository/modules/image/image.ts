import HttpFactory from '../../factory';
import MerchantRoutes from '../../routes.client';
import type { UploadImageResp } from './models/response/upload-image.resp';
import type { UploadImagesResp } from './models/response/upload-images.resp';

export type ImageUploadNameType = 'merchant-logo' | 'merchant-thumbnail' | 'product-thumbnail' | 'product-gallery';

const ALLOWED_MIME_TYPES = ['image/jpg', 'image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence', 'image/webp'] as const;
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp'] as const;

export const IMAGE_FORMAT_ERROR_MESSAGE = 'Unsupported image format. Allowed: JPG, JPEG, PNG, HEIC, WebP';

function assertAllowedImageFormat(file: File): void {
	const mime = file.type.toLowerCase();
	const filename = file.name.toLowerCase();
	const hasAllowedExtension = ALLOWED_EXTENSIONS.some((extension) => filename.endsWith(extension));
	if (!ALLOWED_MIME_TYPES.includes(mime as (typeof ALLOWED_MIME_TYPES)[number]) && !hasAllowedExtension) {
		throw new Error(IMAGE_FORMAT_ERROR_MESSAGE);
	}
}

class ImageModule extends HttpFactory {
	private RESOURCE = MerchantRoutes.Images;

	async upload(file: File, dir: string, nameType?: ImageUploadNameType, nameIndex?: number): Promise<UploadImageResp> {
		assertAllowedImageFormat(file);
		const formData = new FormData();
		formData.append('file', file);
		formData.append('dir', dir);
		if (nameType) formData.append('nameType', nameType);
		if (nameIndex !== undefined) formData.append('nameIndex', String(nameIndex));

		return await this.call<UploadImageResp>({
			method: 'POST',
			url: `${this.RESOURCE.Upload()}`,
			body: formData,
		});
	}

	async uploadMultiple(files: File[], dir: string, nameType?: ImageUploadNameType): Promise<UploadImagesResp> {
		files.forEach(assertAllowedImageFormat);
		const formData = new FormData();
		files.forEach((file) => {
			formData.append('files', file);
		});
		formData.append('dir', dir);
		if (nameType) formData.append('nameType', nameType);

		return await this.call<UploadImagesResp>({
			method: 'POST',
			url: `${this.RESOURCE.UploadMultiple()}`,
			body: formData,
		});
	}
}

export default ImageModule;
