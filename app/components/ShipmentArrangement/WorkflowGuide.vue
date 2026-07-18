<template>
	<section class="space-y-4" aria-labelledby="shipment-workflow-title">
		<div class="rounded-lg border border-default bg-default p-4 sm:p-5">
			<h2 id="shipment-workflow-title" class="sr-only">{{ $t('shipmentArrangement.workflow.title') }}</h2>
			<ol class="grid gap-5 lg:grid-cols-3 lg:gap-6">
				<li v-for="step in steps" :key="step.number" data-testid="workflow-step" class="flex min-w-0 gap-3">
					<span
						class="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
						:class="step.number === 1 ? 'bg-primary text-inverted' : 'bg-elevated text-muted'"
					>
						{{ step.number }}
					</span>
					<div class="min-w-0 flex-1">
						<div class="flex items-start gap-3">
							<UIcon :name="step.icon" class="mt-0.5 size-5 shrink-0 text-muted" />
							<div class="min-w-0">
								<p class="font-semibold text-default">{{ step.title }}</p>
								<p class="mt-1 text-sm leading-5 text-muted">{{ step.body }}</p>
							</div>
						</div>

						<UButton
							v-if="step.number === 1"
							data-testid="workflow-export"
							class="mt-3 min-h-11 w-full justify-center sm:w-auto"
							icon="i-lucide-download"
							:label="$t('shipmentArrangement.workflow.downloadCount', { count: pendingCount })"
							:disabled="pendingCount === 0"
							:loading="exporting"
							@click="emit('export')"
						/>
						<UButton
							v-else-if="step.number === 3"
							data-testid="workflow-import"
							class="mt-3 min-h-11 w-full justify-center sm:w-auto"
							color="primary"
							variant="outline"
							icon="i-lucide-upload"
							:label="$t('shipmentArrangement.workflow.upload')"
							:loading="importing"
							@click="emit('import')"
						/>
					</div>
				</li>
			</ol>
		</div>

		<UAlert
			color="warning"
			variant="soft"
			icon="i-lucide-triangle-alert"
			:description="$t('shipmentArrangement.workflow.consequence')"
		/>
	</section>
</template>

<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		pendingCount: number;
		exporting?: boolean;
		importing?: boolean;
	}>(),
	{
		exporting: false,
		importing: false,
	},
);

const emit = defineEmits<{
	export: [];
	import: [];
}>();

const { t } = useI18n();
const steps = computed(() => [
	{
		number: 1,
		icon: 'i-lucide-files',
		title: t('shipmentArrangement.workflow.exportTitle'),
		body: t('shipmentArrangement.workflow.exportBody', { count: props.pendingCount }),
	},
	{
		number: 2,
		icon: 'i-lucide-pencil-line',
		title: t('shipmentArrangement.workflow.fillTitle'),
		body: t('shipmentArrangement.workflow.fillBody'),
	},
	{
		number: 3,
		icon: 'i-lucide-upload',
		title: t('shipmentArrangement.workflow.importTitle'),
		body: t('shipmentArrangement.workflow.importBody'),
	},
]);
</script>
