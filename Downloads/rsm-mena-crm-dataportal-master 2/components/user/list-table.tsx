"use client"

import * as React from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Define the data structure for our list items
export interface ListItem {
  id: string
  name?: string
  accounts: string
  contacts: number
  date: string
  status: "active" | "pending" | "archived" | "completed"
}

interface ListTableProps {
  data: ListItem[]
  onRowClick?: (item: ListItem) => void
}

export function ListTable({ data, onRowClick }: ListTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Define columns for the table
  const columns: ColumnDef<ListItem>[] = [
    {
      accessorKey: "name",
      header: "List Name",
      cell: ({ row }) => (
        <div className="font-medium text-gray-900 whitespace-nowrap">{row.getValue("name") || "N/A"}</div>
      ),
    },
    {
      accessorKey: "contacts",
      header: "Contacts",
      cell: ({ row }) => (
        <div className="text-gray-700 font-medium whitespace-nowrap">{row.getValue("contacts")}</div>
      ),
    },
    {
      accessorKey: "date",
      header: "Dates",
      cell: ({ row }) => (
        <div className="text-gray-500 text-sm whitespace-nowrap">{row.getValue("date")}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        
        return (
          <Badge 
            className={cn(
              "px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap",
              status === "active" && "bg-green-100 text-green-800 hover:bg-green-200",
              status === "pending" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
              status === "archived" && "bg-gray-100 text-gray-800 hover:bg-gray-200",
              status === "completed" && "bg-blue-100 text-blue-800 hover:bg-blue-200"
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    filterFns: {} as any, // Add filterFns to fix TypeScript error
    state: {
      sorting,
      pagination,
    },
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
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    console.log("Row clicked:", row.original.id, row.original.name);
                    if (onRowClick) onRowClick(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No lists found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            data.length
          )}{" "}
          of {data.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0 flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm text-gray-500">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0 flex items-center justify-center"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 