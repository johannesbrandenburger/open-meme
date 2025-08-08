import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shadow-xs backdrop-blur",
  {
    variants: {
      variant: {
        default:
          "text-primary-foreground shadow-sm bg-[linear-gradient(180deg,theme(colors.primary/90),theme(colors.primary/75))] hover:bg-[linear-gradient(180deg,theme(colors.primary),theme(colors.primary/85))]",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-[color-mix(in_oklab,white_6%,transparent)] shadow-xs hover:bg-[color-mix(in_oklab,white_10%,transparent)] hover:text-accent-foreground dark:bg-input/30 dark:border-input/70",
        secondary:
          "bg-[linear-gradient(180deg,theme(colors.secondary/90),theme(colors.secondary/65))] text-secondary-foreground shadow-sm hover:bg-[linear-gradient(180deg,theme(colors.secondary),theme(colors.secondary/80))]",
        ghost:
          "hover:bg-accent/20 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "border border-border/60 bg-[color-mix(in_oklab,white_7%,transparent)] text-foreground hover:bg-[color-mix(in_oklab,white_10%,transparent)] shadow-sm",
        success:
          "text-white shadow-sm bg-[linear-gradient(180deg,oklch(0.72_0.18_150),oklch(0.6_0.16_150))] hover:bg-[linear-gradient(180deg,oklch(0.75_0.2_150),oklch(0.62_0.18_150))]",
        danger:
          "text-white shadow-sm bg-[linear-gradient(180deg,oklch(0.6_0.2_27),oklch(0.5_0.18_27))] hover:bg-[linear-gradient(180deg,oklch(0.62_0.22_27),oklch(0.52_0.2_27))]",
      },
      size: {
        default: "h-10 px-3.5 py-2 has-[>svg]:px-3",
  sm: "h-8 rounded-md gap-1.5 px-2.5 has-[>svg]:px-2",
        lg: "h-11 rounded-md px-5 has-[>svg]:px-4",
  icon: "size-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
