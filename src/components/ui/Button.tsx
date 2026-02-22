"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary:
        "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] focus:ring-[var(--accent-ring)] shadow-sm hover:shadow-md",
      secondary:
        "bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--border-primary)] focus:ring-[var(--accent-ring)]",
      ghost:
        "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] focus:ring-[var(--accent-ring)]",
      danger: "bg-[var(--red)] text-white hover:bg-[var(--red-dark)] focus:ring-red-500",
    };

    const sizes = {
      sm: "px-2.5 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
