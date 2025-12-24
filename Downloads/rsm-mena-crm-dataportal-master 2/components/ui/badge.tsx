import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-gray-900 text-white",
        secondary:
          "bg-gray-100 text-gray-800",
        destructive:
          "bg-red-100 text-red-800",
        outline: 
          "border border-gray-200 text-gray-800",
        purple:
          "bg-purple-100 text-purple-800",
        blue:
          "bg-blue-100 text-blue-800",
        yellow:
          "bg-yellow-100 text-yellow-800",
        green:
          "bg-green-100 text-green-800",
        indigo:
          "bg-indigo-100 text-indigo-800",
        orange:
          "bg-orange-100 text-orange-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
