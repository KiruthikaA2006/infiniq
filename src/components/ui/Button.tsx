"use client";

import React, { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isMono?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", isMono = false, children, className = "", disabled, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    const baseStyles =
      "relative inline-flex items-center justify-center font-medium transition-all duration-150 rounded-md infiniq-focus select-none disabled:opacity-40 disabled:pointer-events-none cursor-pointer";
    
    const variantStyles = {
      primary: "bg-infiniq-accent text-[#080907] font-semibold hover:bg-infiniq-accent-highlight active:bg-infiniq-accent-secondary border border-infiniq-accent/40 shadow-xs",
      secondary: "bg-infiniq-surface-1 text-infiniq-text-primary border border-infiniq-border hover:border-infiniq-border-hover hover:bg-infiniq-surface-2",
      ghost: "bg-transparent text-infiniq-text-secondary hover:text-infiniq-text-primary hover:bg-infiniq-surface-1",
      danger: "bg-rose-950/20 text-rose-300 border border-rose-500/25 hover:bg-rose-950/40 hover:border-rose-500/40",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-5 py-2.5 text-base gap-2.5",
    };

    const fontStyle = isMono ? "font-mono tracking-tight uppercase text-[0.8em]" : "font-sans";

    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        whileHover={shouldReduceMotion || disabled ? {} : { scale: 1.01 }}
        whileTap={shouldReduceMotion || disabled ? {} : { scale: 0.985 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fontStyle} ${className}`}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
