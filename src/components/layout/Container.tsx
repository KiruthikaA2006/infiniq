import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  isMobileLocked?: boolean;
}

export default function Container({
  children,
  className = "",
  isMobileLocked = true,
}: ContainerProps) {
  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 transition-all duration-300 ${
        isMobileLocked
          ? "max-w-[390px]"
          : "max-w-[390px] sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl"
      } ${className}`}
    >
      {children}
    </div>
  );
}
