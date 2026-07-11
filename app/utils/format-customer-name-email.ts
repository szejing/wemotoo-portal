/**
 * Formats customer name and email for table display.
 * Guest checkout often sets name to the email — show email only in that case.
 */
export function formatCustomerNameEmail(name?: string | null, email?: string | null): string {
	const trimmedName = String(name ?? '').trim();
	const trimmedEmail = String(email ?? '').trim();

	if (!trimmedName) {
		return trimmedEmail;
	}

	if (!trimmedEmail) {
		return trimmedName;
	}

	if (trimmedName.toLowerCase() === trimmedEmail.toLowerCase()) {
		return trimmedEmail;
	}

	return `${trimmedName} | ${trimmedEmail}`;
}
