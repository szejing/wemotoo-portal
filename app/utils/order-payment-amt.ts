/** Default payment amount for a new order payment: payable total (net + shipping). */
export function getDefaultOrderPaymentAmt(order: {
	payable_total?: number | null;
	net_total?: number | null;
	net_amt?: number | null;
	shipping_fee?: number | null;
}): number {
	if (order.payable_total != null && Number.isFinite(Number(order.payable_total))) {
		return Number(order.payable_total);
	}

	const net = Number(order.net_total ?? order.net_amt ?? 0);
	const shipping = Number(order.shipping_fee ?? 0);
	return (Number.isFinite(net) ? net : 0) + (Number.isFinite(shipping) ? shipping : 0);
}
