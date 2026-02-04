import {
  type FieldsetLegendProps,
  Fieldset as FieldsetPrimitive,
} from "@base-ui/react/fieldset"

import { cn } from "@/lib/utils"

function Fieldset({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <FieldsetPrimitive.Root
      className={cn("flex w-full flex-col gap-2", className)}
      data-slot="fieldset"
      {...props}
    />
  )
}

function FieldsetLegend({
  className,
  variant = "legend",
  ...props
}: FieldsetLegendProps & { variant?: "legend" | "label" }) {
  return (
    <FieldsetPrimitive.Legend
      className={cn(
        "font-semibold",
        "data-[variant=legend]:text-base",
        "data-[variant=label]:text-sm",
        className
      )}
      data-slot="fieldset-legend"
      {...props}
    />
  )
}

export { Fieldset, FieldsetLegend }
