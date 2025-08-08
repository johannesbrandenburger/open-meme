import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
  className={cn("rounded-md relative overflow-hidden bg-[color-mix(in_oklab,white_8%,transparent)] backdrop-blur after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.6s_infinite] after:bg-[linear-gradient(90deg,transparent,oklch(0.98_0.02_260/_0.25),transparent)]", className)}
      {...props}
    />
  )
}

export { Skeleton }
