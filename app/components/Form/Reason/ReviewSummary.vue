<template>
	<UCard class="border border-primary/30">
		<template #header>
			<div class="flex items-center gap-2">
				<UIcon :name="ICONS.CHECK_ROUNDED" class="w-5 h-5 text-primary" />
				<div>
					<p class="font-semibold">{{ $t('components.reasonForm.reviewTitle') }}</p>
					<p class="text-sm text-muted">{{ $t(subtitleKey) }}</p>
				</div>
			</div>
		</template>

		<dl class="space-y-3 text-sm">
			<div>
				<dt class="text-muted">{{ $t('common.code') }}</dt>
				<dd class="font-medium">{{ summary.code || $t('common.notSet') }}</dd>
			</div>
			<div>
				<dt class="text-muted">{{ $t('common.description') }}</dt>
				<dd class="font-medium">{{ summary.description || $t('common.notSet') }}</dd>
			</div>
			<div>
				<dt class="text-muted">{{ $t('table.reasonType') }}</dt>
				<dd class="font-medium">{{ summary.typeLabel }}</dd>
			</div>
			<div>
				<dt class="text-muted">{{ $t('common.status') }}</dt>
				<dd class="font-medium">{{ summary.statusLabel }}</dd>
			</div>
		</dl>
	</UCard>
</template>

<script setup lang="ts">
import { ICONS } from '~/utils/icons';

defineProps<{
	summary: {
		code: string;
		description: string;
		typeLabel: string;
		statusLabel: string;
	};
	subtitleKey: string;
}>();
</script>
