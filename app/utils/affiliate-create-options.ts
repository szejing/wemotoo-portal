import type { AffiliateTier } from "~/utils/types/affiliate";
import type { Customer } from "~/utils/types/customer";

export type AffiliateCustomerOption = {
  label: string;
  description: string;
  value: string;
  customer: Customer;
};

export type AffiliateTierOption = {
  label: string;
  description: string;
  value: number;
  tier: AffiliateTier;
};

export function customerToAffiliateOption(
  customer: Customer,
): AffiliateCustomerOption {
  const label =
    customer.name?.trim() || customer.email_address || customer.customer_no;
  const descriptionParts = [
    customer.email_address,
    customer.customer_no,
  ].filter(Boolean);

  return {
    label,
    description: descriptionParts.join(" - "),
    value: customer.customer_no,
    customer,
  };
}

export function tierToAffiliateOption(
  tier: AffiliateTier,
): AffiliateTierOption {
  return {
    label: tier.name,
    description: `${tier.default_commission_percentage}% commission - ${tier.min_referrals} referrals`,
    value: tier.id,
    tier,
  };
}
