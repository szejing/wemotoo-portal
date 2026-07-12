import { OrderCompletionValidation } from 'yeppi-common';

export const orderCompletionValidationItems = [
	{ value: OrderCompletionValidation.NONE, label: 'None' },
	{ value: OrderCompletionValidation.PAYMENT_MANDATORY, label: 'Payment Mandatory' },
	{ value: OrderCompletionValidation.SHIPMENT_MANDATORY, label: 'Shipment Mandatory' },
	{
		value: OrderCompletionValidation.PAYMENT_AND_SHIPMENT_MANDATORY,
		label: 'Payment & Shipment Mandatory',
	},
] as const;

export const orderCompletionValidationDataSource = 'OrderCompletionValidation';

export const getOrderCompletionValidationItems = (dataSource: string) => {
	if (dataSource === orderCompletionValidationDataSource) {
		return orderCompletionValidationItems;
	}

	return [];
};
