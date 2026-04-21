"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
        pill:
          "h-auto gap-2 rounded-none border-0 bg-transparent p-0 shadow-none group-data-horizontal/tabs:min-h-0 group-data-horizontal/tabs:h-auto",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "group-data-[variant=pill]/tabs-list:h-auto group-data-[variant=pill]/tabs-list:min-h-9 group-data-[variant=pill]/tabs-list:rounded-full group-data-[variant=pill]/tabs-list:border group-data-[variant=pill]/tabs-list:px-4 group-data-[variant=pill]/tabs-list:py-2 group-data-[variant=pill]/tabs-list:shadow-none group-data-[variant=pill]/tabs-list:transition-[color,background-color,border-color,transform] group-data-[variant=pill]/tabs-list:duration-150 group-data-[variant=pill]/tabs-list:ease-out group-data-[variant=pill]/tabs-list:after:hidden",
        // Pill tabs: ensure hover/pressed/selected steps remain visible in both themes.
        "group-data-[variant=pill]/tabs-list:data-[state=inactive]:border-[var(--border-default)] group-data-[variant=pill]/tabs-list:data-[state=inactive]:bg-transparent group-data-[variant=pill]/tabs-list:data-[state=inactive]:text-[var(--text-tertiary)] group-data-[variant=pill]/tabs-list:data-[state=inactive]:hover:border-[var(--border-default)] group-data-[variant=pill]/tabs-list:data-[state=inactive]:hover:bg-[var(--bg-secondary)]/55 dark:group-data-[variant=pill]/tabs-list:data-[state=inactive]:hover:bg-[var(--bg-tertiary)]/60 group-data-[variant=pill]/tabs-list:data-[state=inactive]:hover:text-[var(--text-secondary)] group-data-[variant=pill]/tabs-list:data-[state=inactive]:active:scale-[0.99] group-data-[variant=pill]/tabs-list:data-[state=inactive]:active:bg-[var(--bg-secondary)]/72 dark:group-data-[variant=pill]/tabs-list:data-[state=inactive]:active:bg-[var(--bg-elevated)]/85 group-data-[variant=pill]/tabs-list:data-[state=inactive]:active:text-[var(--text-secondary)]",
        "group-data-[variant=pill]/tabs-list:data-[state=active]:border-[var(--border-strong)] group-data-[variant=pill]/tabs-list:data-[state=active]:bg-[var(--bg-secondary)] dark:group-data-[variant=pill]/tabs-list:data-[state=active]:bg-[var(--bg-tertiary)] group-data-[variant=pill]/tabs-list:data-[state=active]:text-[var(--text-primary)] group-data-[variant=pill]/tabs-list:data-[state=active]:hover:border-[var(--border-strong)] group-data-[variant=pill]/tabs-list:data-[state=active]:hover:bg-[var(--bg-tertiary)] dark:group-data-[variant=pill]/tabs-list:data-[state=active]:hover:bg-[var(--bg-elevated)] group-data-[variant=pill]/tabs-list:data-[state=active]:hover:text-[var(--text-primary)] group-data-[variant=pill]/tabs-list:data-[state=active]:active:scale-[0.99] group-data-[variant=pill]/tabs-list:data-[state=active]:active:bg-[var(--bg-secondary)] dark:group-data-[variant=pill]/tabs-list:data-[state=active]:active:bg-[var(--bg-secondary)]",
        "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
