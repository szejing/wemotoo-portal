import { dir } from './constants/dir';

export const getPaymentMethodLogoUploadDir = (code: string) => `${dir.payment_methods}/${code}`;
