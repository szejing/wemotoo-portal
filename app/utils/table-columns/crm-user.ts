import type { ColumnDef } from '@tanstack/vue-table';
import type { CRMUser } from '~/utils/types/crm-user';
import { formatCrmUserPhone } from '../utils';
import { USwitch } from '#components';
import { useCRMUserStore } from '~/stores/CRMUser/CRMUser';
import { roleLabel } from '../options/user-roles';
import { getSortableHeader, headerCell, mutedCell, numberCell, primaryCell, tableCellMeta } from './styles';

type TranslateFn = (key: string) => string;

type CrmUserColumnOptions = {
	hideStaffDepartment?: boolean;
};

export function getCrmUserColumns(t: TranslateFn, options?: CrmUserColumnOptions): ColumnDef<CRMUser>[] {
	const columns: ColumnDef<CRMUser>[] = [
		{
			accessorKey: 'row_index',
			header: () => headerCell('', 'center'),
			cell: ({ row }) => numberCell(row.index + 1, 'center'),
			...tableCellMeta.center,
		},
		{
			accessorKey: 'name',
			header: ({ column }) => getSortableHeader(column, t('table.name')),
			cell: ({ row }) => {
				const u = row.original;
				const fullName = u.name || '—';
				return h('div', { class: 'flex flex-col gap-1 items-start min-w-0' }, [
					h('p', { class: 'font-semibold text-highlighted' }, fullName),
					h('p', { class: 'text-sm text-muted' }, u.email_address),
				]);
			},
		},
		{
			accessorKey: 'phone_no',
			header: ({ column }) => getSortableHeader(column, t('table.phone')),
			cell: ({ row }) => primaryCell(formatCrmUserPhone(row.original)),
		},
		{
			accessorKey: 'role',
			header: ({ column }) => getSortableHeader(column, t('table.role')),
			cell: ({ row }) => {
				const label = roleLabel(row.original.role, t);
				return h(
					'span',
					{
						class:
							'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200',
					},
					label,
				);
			},
		},
	];

	if (!options?.hideStaffDepartment) {
		columns.push({
			accessorKey: 'staff_department_id',
			header: ({ column }) => getSortableHeader(column, t('table.staffDepartment')),
			cell: ({ row }) => {
				const department = row.original.staff_department;
				if (!department) {
					return mutedCell('—');
				}
				return h('div', { class: 'flex flex-col gap-1' }, [
					h('p', { class: 'font-medium text-default' }, department.name),
					h('p', { class: 'text-xs text-muted tabular-nums' }, `${department.default_commission_rate}%`),
				]);
			},
		});
	}

	columns.push({
		accessorKey: 'is_active',
		header: () => headerCell(t('common.status')),
		cell: ({ row }) => {
			const crmUserStore = useCRMUserStore();
			return h(
				'div',
				{
					class: 'flex items-center gap-2 leading-none',
					onClick: (e: Event) => e.stopPropagation(),
				},
				[
					h(USwitch, {
						'class': 'size-4 cursor-pointer',
						'modelValue': row.original.is_active,
						'disabled': false,
						'onUpdate:modelValue': (value: unknown) => {
							void crmUserStore.updateStatus(row.original, value === true);
						},
					}),
				],
			);
		},
	});

	return columns;
}
