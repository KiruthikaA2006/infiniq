import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  isMobileLocked?: boolean;
}

export default function Container({
  children,
  className = "",
  size = "xl",
  isMobileLocked = false,
}: ContainerProps) {
  const sizeClasses = {
    sm: "max-w-xl",
    md: "max-w-3xl",
    lg: "max-w-5xl",
    xl: "max-w-6xl",
    full: "max-w-7xl",
  };

  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-200 ${
        isMobileLocked ? "max-w-[390px]" : sizeClasses[size]
      } ${className}`}
    >
      {children}
    </div>
  );
}
