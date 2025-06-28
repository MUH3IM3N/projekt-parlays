import React from "react";

export function Card({ children, className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`rounded-xl bg-neutral-800 border border-neutral-600 shadow ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
