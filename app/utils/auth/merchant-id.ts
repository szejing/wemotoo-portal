import { KEY } from 'yeppi-common';

/** Local storage key for the last merchant id used at login (Wemotoo MID). */
export const WMID_STORAGE_KEY = 'wmid';

/** Legacy login form key — read for migration only. */
const LEGACY_LOGIN_MERCHANT_ID_KEY = 'wemotoo-login-merchant-id';

export function normalizeMerchantId(value: string | null | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed.toUpperCase() : undefined;
}

export function readWmidFromStorage(): string | undefined {
	if (!import.meta.client) {
		return undefined;
	}

	try {
		return (
			normalizeMerchantId(localStorage.getItem(WMID_STORAGE_KEY)) ??
			normalizeMerchantId(localStorage.getItem(LEGACY_LOGIN_MERCHANT_ID_KEY))
		);
	} catch {
		return undefined;
	}
}

export function writeWmidToStorage(merchant_id: string): void {
	if (!import.meta.client) {
		return;
	}

	try {
		const normalized = normalizeMerchantId(merchant_id);
		if (!normalized) {
			return;
		}
		localStorage.setItem(WMID_STORAGE_KEY, normalized);
	} catch {
		// ignore (e.g. private mode)
	}
}

export function resolveSessionMerchantId(cookieValue?: string | null): string | undefined {
	return normalizeMerchantId(cookieValue) ?? readWmidFromStorage();
}

export function ensureMerchantIdCookie(merchant_id: string | undefined): void {
	const normalized = normalizeMerchantId(merchant_id);
	if (!normalized) {
		return;
	}

	const mid = useCookie(KEY.X_MERCHANT_ID, { maxAge: 60 * 60 * 24 * 7 });
	if (!mid.value) {
		mid.value = normalized;
	}
}
