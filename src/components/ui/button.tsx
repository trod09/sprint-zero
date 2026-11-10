import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

/**
 * Arcade buttons: a 2px frame, a solid shadow under the button, and a press
 * that sinks it. Ghost and link stay flat for dense lists.
 */
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-md border-2 border-frame font-pixel text-sm font-medium tracking-wide whitespace-nowrap shadow-[0_3px_0_0_var(--shadow-color)] transition-[transform,box-shadow,background-color] duration-100 outline-none select-none hover:-translate-y-px hover:shadow-[0_4px_0_0_var(--shadow-color)] focus-visible:ring-3 focus-visible:ring-ring/60 active:not-aria-[haspopup]:translate-y-[2px] active:not-aria-[haspopup]:shadow-[0_1px_0_0_var(--shadow-color)] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[color-mix(in_oklch,var(--primary),white_12%)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),white_10%)]",
        outline:
          "bg-card text-foreground hover:bg-muted aria-expanded:bg-muted",
        ghost:
          "border-transparent shadow-none hover:translate-y-0 hover:bg-muted hover:shadow-none active:not-aria-[haspopup]:translate-y-0 active:not-aria-[haspopup]:shadow-none aria-expanded:bg-muted",
        destructive:
          "border-destructive bg-card text-destructive hover:bg-destructive/10",
        link: "border-transparent font-sans text-brand underline-offset-4 shadow-none hover:translate-y-0 hover:underline hover:shadow-none active:not-aria-[haspopup]:translate-y-0 active:not-aria-[haspopup]:shadow-none",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 rounded-sm px-2 text-xs shadow-[0_2px_0_0_var(--shadow-color)] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-base",
        icon: "size-9",
        "icon-xs":
          "size-6 rounded-sm shadow-[0_2px_0_0_var(--shadow-color)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
