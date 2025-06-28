import React from "react";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={
        "block w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-base text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#00D2BE]/40 " +
        className
      }
      {...props}
    />
  )
);

Input.displayName = "Input";
