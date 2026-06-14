import { cn } from "@/lib/utils";

/** Material Symbols Outlined icon (matches the Stitch designs' iconography). */
export function Icon({
  name,
  className,
  fill = false,
}: {
  name: string;
  className?: string;
  fill?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined", fill && "fill", className)}
    >
      {name}
    </span>
  );
}
