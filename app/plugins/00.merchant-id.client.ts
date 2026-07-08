import { ensureMerchantIdCookie, readWmidFromStorage } from '~/utils/auth/merchant-id';

/** Restore x-merchant-id cookie from persisted wmid before auth/session checks run on the client. */
export default defineNuxtPlugin(() => {
	ensureMerchantIdCookie(readWmidFromStorage());
});
