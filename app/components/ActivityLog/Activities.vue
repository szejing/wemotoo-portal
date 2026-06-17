<script setup lang="ts">
import type { TimelineItem } from '@nuxt/ui';
import type { ActivityLogRichTextSegment } from '~/utils/activity-log-rich-text';
import type { OrderActivity } from '~/utils/types/order-fulfillment-shipping';
import { parseActivityLogRichText } from '~/utils/activity-log-rich-text';

type ActivityTimelineItem = TimelineItem & {
	courierService?: string;
	trackingNo?: string;
	actor: string;
	segments: ActivityLogRichTextSegment[];
};

const props = defineProps<{
	activities?: OrderActivity[];
}>();

const getActionText = (activity: OrderActivity): string => {
	return activity.action ?? activity.desc ?? '-';
};

const getActorText = (activity: OrderActivity): string => {
	return activity.created_by ?? activity.user_id ?? '';
};

const getMetaText = (activity: OrderActivity, key: string): string | undefined => {
	const value = activity.metadata?.[key];
	if (typeof value !== 'string') {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed || undefined;
};

const getCourierServiceText = (activity: OrderActivity): string | undefined => {
	return getMetaText(activity, 'courier_service') ?? getMetaText(activity, 'courier_name');
};

const getTrackingNoText = (activity: OrderActivity): string | undefined => {
	return getMetaText(activity, 'tracking_no');
};

const timelineItems = computed((): ActivityTimelineItem[] => {
	return (props.activities ?? []).map((activity, index) => ({
		date: String(activity.created_at),
		title: getActionText(activity),
		icon: 'i-lucide-sticky-note',
		value: activity.id ?? `${activity.created_at}-${index}`,
		segments: parseActivityLogRichText(getActionText(activity)),
		courierService: getCourierServiceText(activity),
		trackingNo: getTrackingNoText(activity),
		actor: getActorText(activity),
	}));
});

const latestActivityValue = computed(() => {
	const items = timelineItems.value;
	if (!items.length) {
		return undefined;
	}
	return items[items.length - 1]?.value;
});
</script>

<template>
	<UCard>
		<template #header>
			<h3 class="text-base font-semibold">{{ $t('components.activities.title') }}</h3>
		</template>

		<UTimeline v-if="activities?.length" :items="timelineItems" :default-value="latestActivityValue" size="xs" color="primary">
			<template #date="{ item }">
				{{ new Date(item.date!).toLocaleString() }}
			</template>

			<template #title="{ item }">
				<span class="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
					<template v-for="(segment, index) in item.segments" :key="`${item.value}-${index}`">
						<span v-if="segment.type === 'text'">{{ segment.text }}</span>
						<span v-else-if="segment.type === 'identifier'" class="italic underline decoration-dotted underline-offset-4">
							{{ segment.text }}
						</span>
						<UBadge v-else :color="segment.color" variant="subtle" size="md" class="capitalize">
							{{ segment.text }}
						</UBadge>
					</template>
				</span>
			</template>

			<template #description="{ item }">
				<div v-if="item.courierService || item.trackingNo" class="grid gap-1 text-xs text-muted">
					<p v-if="item.courierService">
						<span class="font-medium text-default">{{ $t('components.activities.courierService') }}:</span>
						{{ item.courierService }}
					</p>
					<p v-if="item.trackingNo">
						<span class="font-medium text-default">{{ $t('components.activities.trackingNo') }}:</span>
						{{ item.trackingNo }}
					</p>
				</div>
				<p v-if="item.actor" class="text-xs text-muted">{{ $t('components.activities.createdBy') }}: {{ item.actor }}</p>
			</template>
		</UTimeline>
		<p v-else class="text-sm text-muted">{{ $t('components.activities.empty') }}</p>
	</UCard>
</template>
