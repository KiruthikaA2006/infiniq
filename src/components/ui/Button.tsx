"use client";

import React, { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isMono?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", isMono = false, children, className = "", disabled, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    const baseStyles =
      "relative inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-md infiniq-focus disabled:opacity-40 disabled:pointer-events-none";
    
    const variantStyles = {
      primary: "bg-infiniq-indigo text-[#f8fafc] hover:bg-opacity-90 active:bg-opacity-80 border border-infiniq-indigo/10 shadow-[0_1px_3px_rgba(0,0,0,0.5),0_0_12px_rgba(99,102,241,0.15)]",
      secondary: "bg-infiniq-surface-2 text-infiniq-text-primary border border-infiniq-border hover:border-infiniq-border-hover hover:bg-infiniq-surface-3",
      ghost: "bg-transparent text-infiniq-text-secondary hover:text-infiniq-text-primary hover:bg-infiniq-surface-1",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-base",
    };

    const fontStyle = isMono ? "font-mono tracking-tight uppercase text-[0.8em]" : "font-sans";

    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        whileHover={shouldReduceMotion || disabled ? {} : { scale: 1.015 }}
        whileTap={shouldReduceMotion || disabled ? {} : { scale: 0.985 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
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
