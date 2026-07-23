export type BaseODataReq = {
	$orderby?: string;
	$skip?: number;
	$top?: number;
	$count?: boolean;
	$select?: string;
	$expand?: string;
	$search?: string;
	$filter?: string;
	include_item_details?: boolean;
};
