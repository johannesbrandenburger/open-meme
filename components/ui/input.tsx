import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input/70 flex h-11 w-full min-w-0 rounded-lg border bg-[color-mix(in_oklab,white_6%,transparent)] px-3 py-2 text-base shadow-xs transition-[color,box-shadow,border,background] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm backdrop-blur-xl",
        "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-2 focus:bg-[color-mix(in_oklab,white_10%,transparent)]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
