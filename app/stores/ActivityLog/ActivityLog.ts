import { format, sub } from 'date-fns';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { ErrorResponse } from '~/repository/base/error';
import { failedNotification } from '~/stores/AppUi/AppUi';
import { options_page_size } from '~/utils/options';
import type {
	ActivityLog,
	ActivityLogAction,
	ActivityLogActorType,
	ActivityLogSource,
	ActivityLogVisibility,
} from '~/utils/types/activity-log';
import type { Range } from '~/utils/interface';

type ActivityLogFilter = {
	query: string;
	action: ActivityLogAction | undefined;
	actor_type: ActivityLogActorType | undefined;
	source: ActivityLogSource | undefined;
	visibility: ActivityLogVisibility | undefined;
	date_range: Range;
	page_size: number;
	current_page: number;
};

const initialEmptyFilter: ActivityLogFilter = {
	query: '',
	action: undefined,
	actor_type: undefined,
	source: undefined,
	visibility: undefined,
	date_range: {
		start: sub(new Date(), { days: 30 }),
		end: new Date(),
	},
	page_size: options_page_size[0] as number,
	current_page: 1,
};

const formatFilterDate = (date: Date, endOfDay = false) => `${format(date, 'yyyy-MM-dd')}T${endOfDay ? '23:59:59' : '00:00:00'}`;

const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

export const useActivityLogStore = defineStore('activityLogStore', {
	state: () => ({
		loading: false as boolean,
		exporting: false as boolean,
		activity_logs: [] as ActivityLog[],
		total_activity_logs: 0 as number,
		filter: structuredClone(initialEmptyFilter),
	}),
	actions: {
		resetFilters() {
			this.filter = structuredClone(initialEmptyFilter);
		},

		buildFilter(): string {
			const clauses: string[] = [];

			if (this.filter.action) {
				clauses.push(`action eq ${quote(this.filter.action)}`);
			}

			if (this.filter.actor_type) {
				clauses.push(`actor_type eq ${quote(this.filter.actor_type)}`);
			}

			if (this.filter.source) {
				clauses.push(`source eq ${quote(this.filter.source)}`);
			}

			if (this.filter.visibility) {
				clauses.push(`visibility eq ${quote(this.filter.visibility)}`);
			}

			const { start, end } = this.filter.date_range;
			if (start || end) {
				const startDate = start ?? end ?? new Date();
				const endDate = end ?? startDate;
				clauses.push(`created_at between ${quote(formatFilterDate(startDate))} and ${quote(formatFilterDate(endDate, true))}`);
			}

			return clauses.join(' and ');
		},

		async updatePageSize(size: number) {
			this.filter.page_size = size;
			this.filter.current_page = 1;
			await this.getActivityLogs();
		},

		async updatePage(page: number) {
			this.filter.current_page = page;
			await this.getActivityLogs();
		},

		async getActivityLogs() {
			this.loading = true;
			const { $api } = useNuxtApp();

			try {
				const filter = this.buildFilter();
				const queryParams: BaseODataReq = {
					$top: this.filter.page_size,
					$count: true,
					$skip: (this.filter.current_page - 1) * this.filter.page_size,
					$orderby: 'created_at desc',
				};

				if (filter) {
					queryParams.$filter = filter;
				}

				if (this.filter.query) {
					queryParams.$search = this.filter.query;
				}

				const { data, '@odata.count': total } = await $api.activityLog.getMany(queryParams);

				this.activity_logs = data ?? [];
				this.total_activity_logs = total ?? 0;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load activity logs';
				failedNotification(message);
			} finally {
				this.loading = false;
			}
		},
	},
});
