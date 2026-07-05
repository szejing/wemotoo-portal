export default defineNuxtRouteMiddleware((to) => {
	const slug = to.params.slug;
	if (!slug) {
		return navigateTo('/products/listing');
	}
});
