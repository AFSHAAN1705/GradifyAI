import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_0_28px_rgba(101,228,255,0.28)] hover:brightness-110",
        secondary: "border border-[var(--border)] bg-[rgba(255,255,255,0.08)] text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.14)]",
        outline: "border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.08)]",
        ghost: "text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.09)]"
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        icon: "h-10 w-10 px-0"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
