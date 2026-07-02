import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('stores index', () => {
	it('exports the activity log store composable for Nuxt auto imports', () => {
		const storeIndex = readFileSync(resolve(process.cwd(), 'app/stores/index.ts'), 'utf8');

		expect(storeIndex).toContain("import { useActivityLogStore } from './ActivityLog/ActivityLog';");
		expect(storeIndex).toContain('useActivityLogStore,');
	});
});
