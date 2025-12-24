"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type PipelineStage = "hot" | "meeting scheduled" | "meeting done" | "opportunity"

export interface PipelineRow {
  _id: string
  meta?: { fullName?: string; company?: string; email?: string; phone?: string; industry?: string }
  stage: PipelineStage
}

interface PipelineTableProps {
  data: PipelineRow[]
  stages: PipelineStage[]
  onStageChange: (id: string, stage: PipelineStage) => void
  onDetails: (row: PipelineRow) => void
}

export function PipelineTable({ data, stages, onStageChange, onDetails }: PipelineTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  const columns = React.useMemo<ColumnDef<PipelineRow>[]>(() => [
    {
      id: 'name',
      header: 'Name',
      accessorFn: (row) => (row as any).meta?.fullName || ((row as any).data?.first_name || '') + ' ' + ((row as any).data?.last_name || '') || (row as any).data?.contact_name || '-',
      cell: ({ row }) => (
        <div className="font-medium text-gray-900 whitespace-nowrap">{(row.original as any).meta?.fullName || `${(row.original as any).data?.first_name || ''} ${(row.original as any).data?.last_name || ''}`.trim() || (row.original as any).data?.contact_name || '-'}</div>
      )
    },
    {
      id: 'company',
      header: 'Company',
      accessorFn: (row) => (row as any).meta?.company || (row as any).data?.company_name || (row as any).data?.account_name || '-',
      cell: ({ row }) => <div className="text-gray-700 whitespace-nowrap">{(row.original as any).meta?.company || (row.original as any).data?.company_name || (row.original as any).data?.account_name || '-'}</div>
    },
    {
      id: 'email',
      header: 'Email',
      accessorFn: (row) => (row as any).meta?.email || (row as any).data?.email || (row as any).data?.email_id || '-',
      cell: ({ row }) => <div className="text-gray-600 font-mono text-sm whitespace-nowrap">{(row.original as any).meta?.email || (row.original as any).data?.email || (row.original as any).data?.email_id || '-'}</div>
    },
    {
      id: 'phone',
      header: 'Phone',
      accessorFn: (row) => (row as any).meta?.phone || (row as any).data?.personal_phone || (row as any).data?.contact_number_personal || (row as any).data?.phone || '-',
      cell: ({ row }) => <div className="text-gray-600 font-mono text-sm whitespace-nowrap">{(row.original as any).meta?.phone || (row.original as any).data?.personal_phone || (row.original as any).data?.contact_number_personal || (row.original as any).data?.phone || '-'}</div>
    },
    {
      id: 'industry',
      header: 'Industry',
      accessorFn: (row) => (row as any).meta?.industry || (row as any).data?.industry || (row as any).data?.industry_client || '-',
      cell: ({ row }) => <div className="text-gray-700 whitespace-nowrap">{(row.original as any).meta?.industry || (row.original as any).data?.industry || (row.original as any).data?.industry_client || '-'}</div>
    },
    {
      id: 'stage',
      header: 'Stage',
      accessorFn: (row) => row.stage,
      enableSorting: false,
      cell: ({ row }) => {
        const current = row.original.stage
        const toTitle = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
        const color = (s: string) => {
          const k = s.toLowerCase()
          if (k === 'hot') return 'bg-red-100 text-red-800'
          if (k === 'meeting scheduled') return 'bg-yellow-100 text-yellow-800'
          if (k === 'meeting done') return 'bg-green-100 text-green-800'
          if (k === 'opportunity') return 'bg-blue-100 text-blue-800'
          return 'bg-gray-100 text-gray-800'
        }
        return (
          <div className="flex items-center gap-2">
            <Badge className={`${color(current)} font-medium`}>{toTitle(current)}</Badge>
            <Select value={current} onValueChange={(v: PipelineStage) => onStageChange(row.original._id, v)}>
              <SelectTrigger className="h-8 w-40">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map(s => (
                  <SelectItem key={s} value={s}>{toTitle(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }
    },
  ], [onDetails, onStageChange, stages])

  const table = useReactTable<PipelineRow>({
    data,
    columns,
    filterFns: {} as any,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: { sorting, pagination },
  })

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50 hover:bg-gray-50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-medium whitespace-nowrap">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onDetails(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">No pipeline items.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)} of {data.length}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Prev
          </Button>
          <div className="text-sm text-gray-500">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</div>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}


