import { beforeEach, describe, expect, it } from 'bun:test';
import { AllocationType, DiscountType } from 'yeppi-common';
import MerchantRoutes from '~/repository/routes.client';
import { ApiErrorModel } from '~/utils/types/api-error-model';
import { loginPayload } from '../../../test/repository-model-fixtures';
import { fetchLog, lastFetch, resetFetchMock, type FetchCall } from '../../../test/repository-test-setup';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { BaseODataResp } from '~/repository/base/base.resp';
import type { CRMUser } from '~/utils/types/crm-user';
import * as RepositoryModules from './index';
import AuthModule from './auth/auth';
import CrmUserModule from './crm-user/crm-user';
import DiscountModule from './discount/discount';
import FulfillmentModule from './fulfillment/fulfillment';
import CourierModule from './courier/courier';
import ShippingMethodModule from './shipping-method/shipping-method';
import ShippingZoneModule from './shipping-zone/shipping-zone';

const odata: BaseODataReq = { $top: 5 };

/** Like `resetFetchMock` but controls the resolved / thrown value (still records `fetchLog`). */
function setMockFetch(impl: (request: string, options?: Record<string, unknown>) => Promise<unknown>): void {
	fetchLog.length = 0;
	(globalThis as unknown as { $fetch: typeof $fetch }).$fetch = (async (url: string, opts?: Record<string, unknown>) => {
		const entry: FetchCall = { url, opts: opts ?? {} };
		fetchLog.push(entry);
		return impl(url, opts);
	}) as typeof $fetch;
}

beforeEach(() => {
	resetFetchMock();
});

describe('repository modules + HttpFactory ($fetch)', () => {
	it('returns the JSON body from $fetch (module → call → $fetch)', async () => {
		const user = { id: '1' } as CRMUser;
		const payload = {
			data: [user],
			count: 1,
			value: [user],
			'@odata.count': 1,
		} satisfies BaseODataResp<CRMUser>;
		setMockFetch(async () => payload);

		const mod = new CrmUserModule();
		const result = await mod.getMany(odata);

		expect(result).toBe(payload);
		expect(lastFetch().url).toBe(MerchantRoutes.CrmUsers.Many());
		expect(lastFetch().opts.query).toEqual(odata);
	});

	it('propagates structured API errors from $fetch (same shape as HttpFactory)', async () => {
		const apiErr = { message: 'Not found', response_code: 404 };
		setMockFetch(async () => {
			throw { data: { data: { error: apiErr } } };
		});

		const mod = new CrmUserModule();
		await expect(mod.getSingle('missing')).rejects.toEqual(apiErr);
		expect(lastFetch().url).toBe(MerchantRoutes.CrmUsers.Single('missing'));
	});

	it('wraps non-API failures in ApiErrorModel', async () => {
		setMockFetch(async () => {
			throw new Error('network');
		});

		const mod = new CrmUserModule();
		const err = await mod.getMany(odata).catch((e: unknown) => e);
		expect(err).toBeInstanceOf(ApiErrorModel);
		expect((err as ApiErrorModel).message).toBe('Internal Server Error');
	});
});

describe('DiscountModule', () => {
	it('create posts to portal discount route and unwraps nested data envelope', async () => {
		const inner = {
			code: 'DC-ABC12',
			description: 'Test',
			is_disabled: false,
			starts_at: null,
			ends_at: null,
			usage_limit: null,
			usage_count: 0,
			disc_type: DiscountType.PERCENTAGE,
			disc_value: 10,
			allocation: AllocationType.BILL,
			conditions: [],
			created_at: '2025-01-01T00:00:00.000Z',
			updated_at: '2025-01-01T00:00:00.000Z',
		};
		setMockFetch(async () => ({ data: inner }));

		const mod = new DiscountModule();
		const result = await mod.create({
			description: 'Test',
			is_disabled: false,
			disc_type: DiscountType.PERCENTAGE,
			disc_value: 10,
		});

		expect(result).toEqual(inner);
		expect(lastFetch().url).toBe(MerchantRoutes.Discounts.Create());
		expect(lastFetch().opts.method).toBe('POST');
	});
});

describe('FulfillmentModule', () => {
	it('keeps first-batch repair creation on the order number route', async () => {
		setMockFetch(async () => ({
			fulfillment: {
				id: 'f1',
				order_no: 'ORD-1',
				inv_no: 'INV-1',
				batch_no: 1,
				status: 'pending',
				shipment_status: 'pending',
			},
		}));

		const mod = new FulfillmentModule();
		const payload = { merchant_id: 'm1' };
		await mod.create('ORD-1', payload);

		expect(lastFetch().url).toBe(MerchantRoutes.Fulfillment.Create('ORD-1'));
		expect(lastFetch().opts.method).toBe('POST');
		expect(lastFetch().opts.body).toEqual(payload);
	});

	it('updates a fulfillment arrangement by batch UUID with explicit clears', async () => {
		setMockFetch(async () => ({ fulfillment: { id: 'batch-uuid' } }));
		const mod = new FulfillmentModule();
		const payload = {
			merchant_id: 'm1',
			shipping_method_id: 2,
			shipping_fee: 12.5,
			courier_id: null,
			courier_name: null,
			tracking_no: null,
			reason: 'Customer requested express delivery',
		};

		await mod.update('batch-uuid', payload);

		expect(lastFetch().url).toBe(MerchantRoutes.Fulfillment.Update('batch-uuid'));
		expect(lastFetch().opts.method).toBe('PATCH');
		expect(lastFetch().opts.body).toEqual(payload);
	});

	it.each([
		['processing', 'markProcessing', 'MarkProcessing'],
		['packed', 'markPacked', 'MarkPacked'],
		['fulfilled', 'markFulfilled', 'MarkFulfilled'],
		['shipped', 'markShipped', 'MarkShipped'],
		['delivered', 'markDelivered', 'MarkDelivered'],
	] as const)('calls the %s action with the batch UUID', async (_label, methodName, routeName) => {
		setMockFetch(async () => ({ fulfillment: { id: 'batch-uuid' } }));
		const mod = new FulfillmentModule();
		const payload = { merchant_id: 'm1' };

		await mod[methodName]('batch-uuid', payload);

		expect(lastFetch().url).toBe(MerchantRoutes.Fulfillment[routeName]('batch-uuid'));
		expect(lastFetch().opts.method).toBe('PATCH');
		expect(lastFetch().opts.body).toEqual(payload);
	});
});

describe('CourierModule', () => {
	it('calls courier many route', async () => {
		setMockFetch(async () => ({ data: [], value: [], count: 0 }));

		const mod = new CourierModule();
		const query = { $top: 10, $count: true };
		await mod.getMany(query);

		expect(lastFetch().url).toBe(MerchantRoutes.Couriers.Many());
		expect(lastFetch().opts.method).toBe('GET');
		expect(lastFetch().opts.query).toEqual(query);
	});

	it('calls courier create route', async () => {
		setMockFetch(async () => ({ courier: { id: 1, name: 'Pos Laju' } }));

		const mod = new CourierModule();
		const payload = {
			merchant_id: 'm1',
			name: 'Pos Laju',
			description: 'Domestic courier',
			is_active: true,
		};
		await mod.create(payload);

		expect(lastFetch().url).toBe(MerchantRoutes.Couriers.Create());
		expect(lastFetch().opts.method).toBe('POST');
		expect(lastFetch().opts.body).toEqual(payload);
	});

	it('calls courier update route', async () => {
		setMockFetch(async () => ({ courier: { id: 1, name: 'Pos Laju' } }));

		const mod = new CourierModule();
		const payload = { merchant_id: 'm1', is_active: false };
		await mod.update(1, payload);

		expect(lastFetch().url).toBe(MerchantRoutes.Couriers.Update(1));
		expect(lastFetch().opts.method).toBe('PATCH');
		expect(lastFetch().opts.body).toEqual(payload);
	});

	it('calls courier delete route', async () => {
		setMockFetch(async () => ({ courier: { id: 1, name: 'Pos Laju' } }));

		const mod = new CourierModule();
		await mod.remove(1);

		expect(lastFetch().url).toBe(MerchantRoutes.Couriers.Delete(1));
		expect(lastFetch().opts.method).toBe('DELETE');
	});
});

describe('ShippingMethodModule', () => {
	it('calls shipping methods route', async () => {
		setMockFetch(async () => ({ methods: [] }));

		const mod = new ShippingMethodModule();
		await mod.getMany({ $top: 10 });

		expect(lastFetch().url).toBe(MerchantRoutes.ShippingMethods.Many());
		expect(lastFetch().opts.method).toBe('GET');
	});

	it('calls shipping method create route', async () => {
		setMockFetch(async () => ({ method: { id: 'm1' } }));

		const mod = new ShippingMethodModule();
		const payload = { merchant_id: 'm1', description: 'Standard', priority: 1 };
		await mod.create(payload);

		expect(lastFetch().url).toBe(MerchantRoutes.ShippingMethods.Create());
		expect(lastFetch().opts.method).toBe('POST');
		expect(lastFetch().opts.body).toEqual(payload);
	});

	it('calls shipping resolve route', async () => {
		setMockFetch(async () => ({ shipping_methods: [] }));

		const mod = new ShippingMethodModule();
		await mod.resolveMethods({ merchant_id: 'm1', country_code: 'MY', postal_code: '47500' });

		expect(lastFetch().url).toBe(MerchantRoutes.ShippingMethods.Resolve());
		expect(lastFetch().opts.method).toBe('GET');
		expect(lastFetch().opts.query).toEqual(
			expect.objectContaining({
				country_code: 'MY',
				postal_code: '47500',
			}),
		);
	});

	it('calls shipping method single route', async () => {
		setMockFetch(async () => ({ method: { id: 'm1' } }));

		const mod = new ShippingMethodModule();
		await mod.getSingle('m1');

		expect(lastFetch().url).toBe(MerchantRoutes.ShippingMethods.Single('m1'));
		expect(lastFetch().opts.method).toBe('GET');
	});

	it('calls shipping method update route', async () => {
		setMockFetch(async () => ({ method: { id: 'm1' } }));

		const mod = new ShippingMethodModule();
		const payload = { merchant_id: 'merchant-1', description: 'Express' };
		await mod.update('m1', payload);

		expect(lastFetch().url).toBe(MerchantRoutes.ShippingMethods.Single('m1'));
		expect(lastFetch().opts.method).toBe('PATCH');
		expect(lastFetch().opts.body).toEqual(payload);
	});

	it('calls shipping method delete route', async () => {
		setMockFetch(async () => ({ method: { id: 'm1' } }));

		const mod = new ShippingMethodModule();
		await mod.remove('m1');

		expect(lastFetch().url).toBe(MerchantRoutes.ShippingMethods.Single('m1'));
		expect(lastFetch().opts.method).toBe('DELETE');
	});
});

describe('ShippingZoneModule', () => {
	it('calls shipping zones many route', async () => {
		setMockFetch(async () => ({ data: [], value: [], count: 0 }));

		const mod = new ShippingZoneModule();
		const query = { $top: 10, $count: true };
		await mod.getMany(query);

		expect(lastFetch().url).toBe(MerchantRoutes.ShippingZones.Many());
		expect(lastFetch().opts.method).toBe('GET');
		expect(lastFetch().opts.query).toEqual(query);
	});

	it('calls shipping zone create route', async () => {
		setMockFetch(async () => ({ shipping_zone: { code: 'west-my' } }));

		const mod = new ShippingZoneModule();
		const payload = {
			merchant_id: 'm1',
			code: 'west-my',
			description: 'West',
			country_code: 'MY',
			methods: [{ shipping_method_id: 1, fee: 5, estimated_days: 2 }],
		};
		await mod.create(payload);

		expect(lastFetch().url).toBe(MerchantRoutes.ShippingZones.Create());
		expect(lastFetch().opts.method).toBe('POST');
		expect(lastFetch().opts.body).toEqual(payload);
	});

	it('calls shipping zone single route', async () => {
		setMockFetch(async () => ({ shipping_zone: { code: 'z1' } }));

		const mod = new ShippingZoneModule();
		await mod.getSingle('z1');

		expect(lastFetch().url).toBe(MerchantRoutes.ShippingZones.Single('z1'));
		expect(lastFetch().opts.method).toBe('GET');
	});

	it('calls shipping zone update route', async () => {
		setMockFetch(async () => ({ shipping_zone: { code: 'z1' } }));

		const mod = new ShippingZoneModule();
		const payload = { merchant_id: 'm1', description: 'Renamed' };
		await mod.update('z1', payload);

		expect(lastFetch().url).toBe(MerchantRoutes.ShippingZones.Update('z1'));
		expect(lastFetch().opts.method).toBe('PATCH');
		expect(lastFetch().opts.body).toEqual(payload);
	});

	it('calls shipping zone delete route', async () => {
		setMockFetch(async () => ({ ok: true }));

		const mod = new ShippingZoneModule();
		await mod.remove('z1');

		expect(lastFetch().url).toBe(MerchantRoutes.ShippingZones.Delete('z1'));
		expect(lastFetch().opts.method).toBe('DELETE');
	});
});

import ShippingZoneModule from './shipping-zone/shipping-zone';
import ReasonModule from './reason/reason';

describe('ReasonModule', () => {
	it('calls reasons many route', async () => {
		setMockFetch(async () => ({ data: [], value: [], count: 0 }));

		const mod = new ReasonModule();
		const query = { $top: 10, $count: true };
		await mod.getMany(query);

		expect(lastFetch().url).toBe(MerchantRoutes.Reasons.Many());
		expect(lastFetch().opts.method).toBe('GET');
		expect(lastFetch().opts.query).toEqual(query);
	});

	it('calls reason create route', async () => {
		setMockFetch(async () => ({ reason: { code: 'R1' } }));

		const mod = new ReasonModule();
		const payload = {
			merchant_id: 'm1',
			code: 'R1',
			description: 'Wrong size',
			type: 'return_exchange',
			is_active: true,
		};
		await mod.create(payload);

		expect(lastFetch().url).toBe(MerchantRoutes.Reasons.Create());
		expect(lastFetch().opts.method).toBe('POST');
		expect(lastFetch().opts.body).toEqual(payload);
	});

	it('calls reason single route', async () => {
		setMockFetch(async () => ({ reason: { code: 'R1' } }));

		const mod = new ReasonModule();
		await mod.getSingle('R1');

		expect(lastFetch().url).toBe(MerchantRoutes.Reasons.Single('R1'));
		expect(lastFetch().opts.method).toBe('GET');
	});

	it('calls reason update route', async () => {
		setMockFetch(async () => ({ reason: { code: 'R1' } }));

		const mod = new ReasonModule();
		const payload = { merchant_id: 'm1', description: 'Updated' };
		await mod.update('R1', payload);

		expect(lastFetch().url).toBe(MerchantRoutes.Reasons.Update('R1'));
		expect(lastFetch().opts.method).toBe('PATCH');
		expect(lastFetch().opts.body).toEqual(payload);
	});

	it('calls reason delete route', async () => {
		setMockFetch(async () => ({ ok: true }));

		const mod = new ReasonModule();
		await mod.remove('R1');

		expect(lastFetch().url).toBe(MerchantRoutes.Reasons.Delete('R1'));
		expect(lastFetch().opts.method).toBe('DELETE');
	});
});

describe('multi-step repository flows (call order)', () => {
	it('records sequential auth then CRM requests in fetch order', async () => {
		const auth = new AuthModule();
		const crm = new CrmUserModule();

		await auth.login(loginPayload);
		await auth.verify();
		await crm.getMany(odata);

		expect(fetchLog).toHaveLength(3);
		expect(fetchLog[0]!.url).toBe(MerchantRoutes.Auth.Login());
		expect(fetchLog[1]!.url).toBe(MerchantRoutes.Auth.Verify());
		expect(fetchLog[2]!.url).toBe(MerchantRoutes.CrmUsers.Many());
	});
});

describe('barrel export (./index)', () => {
	it('every exported constructor produces an HttpFactory instance with call()', () => {
		for (const key of Object.keys(RepositoryModules)) {
			const exported = (RepositoryModules as Record<string, unknown>)[key];
			if (typeof exported !== 'function') {
				continue;
			}
			const inst = new (exported as new () => { call: (...args: unknown[]) => unknown })();
			expect(typeof inst.call).toBe('function');
		}
	});
});
