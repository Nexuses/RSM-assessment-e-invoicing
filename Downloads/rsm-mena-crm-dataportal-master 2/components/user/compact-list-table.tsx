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
  useReactTable,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ListItem } from "./list-table"

interface CompactListTableProps {
  data: ListItem[]
  onRowClick?: (item: ListItem) => void
  maxRows?: number
}

export function CompactListTable({ data, onRowClick, maxRows = 5 }: CompactListTableProps) {
  // Remove debug logging
  
  // Limit the number of rows displayed
  const displayData = React.useMemo(() => data.slice(0, maxRows), [data, maxRows]);

  // Define columns for the table
  const columns = React.useMemo<ColumnDef<ListItem>[]>(() => [
    {
      accessorKey: "name",
      header: "List Name",
      cell: ({ row }) => {
        const name = row.getValue("name") || row.original.title || row.original.name || "Untitled List";
        return (
          <div className="font-medium text-gray-900 whitespace-nowrap">{name}</div>
        );
      },
    },
    {
      accessorKey: "accounts",
      header: "Accounts",
      cell: ({ row }) => (
        <div className="text-gray-700 truncate max-w-[150px]" title={row.getValue("accounts")}>
          {row.getValue("accounts")}
        </div>
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        
        return (
          <Badge 
            className={cn(
              "px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap",
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
  ], []);

  const table = useReactTable({
    data: displayData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Disable features we don't need to improve performance
    enableSorting: false,
    enableFiltering: false,
    enableColumnFilters: false,
    enableGlobalFilter: false,
  })

  return (
    <div className="rounded-md border border-gray-200">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-gray-50 hover:bg-gray-50">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="font-medium py-2 h-9 whitespace-nowrap">
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
                className="hover:bg-gray-50 cursor-pointer h-10"
                onClick={() => {
                  console.log("Compact row clicked:", row.original.id, row.original.name);
                  if (onRowClick) onRowClick(row.original);
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-16 text-center"
              >
                No lists found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
} 