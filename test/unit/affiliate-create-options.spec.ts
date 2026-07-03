import { describe, expect, it } from "bun:test";
import {
  customerToAffiliateOption,
  tierToAffiliateOption,
} from "../../app/utils/affiliate-create-options";
import type { AffiliateTier } from "../../app/utils/types/affiliate";
import type { Customer } from "../../app/utils/types/customer";

describe("affiliate create options", () => {
  it("formats customers with name, email, and customer number for selection", () => {
    const customer: Customer = {
      customer_no: "C00001",
      name: "Jane Customer",
      email_address: "jane@example.test",
      dial_code: "+60",
      phone_no: "123",
      last_transaction: new Date("2026-07-01T00:00:00.000Z"),
      total_spent: 100,
      total_biils: 2,
    };

    expect(customerToAffiliateOption(customer)).toEqual({
      label: "Jane Customer",
      description: "jane@example.test - C00001",
      value: "C00001",
      customer,
    });
  });

  it("falls back to email when customer name is blank", () => {
    const customer: Customer = {
      customer_no: "C00002",
      name: "",
      email_address: "fallback@example.test",
      dial_code: "+60",
      phone_no: "123",
      last_transaction: new Date("2026-07-01T00:00:00.000Z"),
      total_spent: 0,
      total_biils: 0,
    };

    expect(customerToAffiliateOption(customer).label).toBe(
      "fallback@example.test",
    );
  });

  it("formats tiers with commission and referral threshold", () => {
    const tier: AffiliateTier = {
      id: 1,
      name: "Gold",
      min_referrals: 10,
      default_commission_percentage: 8.5,
    };

    expect(tierToAffiliateOption(tier)).toEqual({
      label: "Gold",
      description: "8.5% commission - 10 referrals",
      value: 1,
      tier,
    });
  });
});
