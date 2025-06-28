import React from "react";

export function Select({ value, onValueChange, children, className = "" }: any) {
  return (
    <select
      value={value}
      onChange={e => onValueChange(e.target.value)}
      className={"h-12 w-full rounded-full border border-neutral-600 bg-neutral-800 text-neutral-100 px-4 " + className}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children, ...props }: any) {
  return <>{children}</>;
}

export function SelectValue({ placeholder }: any) {
  // Diese Komponente wird als erstes Kind im Select gerendert!
  return <option value="">{placeholder}</option>;
}

export function SelectContent({ children }: any) {
  return <>{children}</>;
}

export function SelectItem({ value, children }: any) {
  return <option value={value}>{children}</option>;
}
