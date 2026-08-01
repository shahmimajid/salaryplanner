import { FieldTooltip } from "@/components/calculator/field-tooltip";

export function DetailRow({
  label,
  value,
  tooltip,
  emphasis,
}: {
  label: string;
  value: string;
  tooltip?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span
        className={
          emphasis
            ? "flex items-center gap-1.5 text-base font-medium"
            : "text-muted-foreground flex items-center gap-1.5 text-sm"
        }
      >
        {label}
        {tooltip ? <FieldTooltip>{tooltip}</FieldTooltip> : null}
      </span>
      <span
        className={emphasis ? "text-xl font-semibold" : "text-sm font-medium"}
      >
        {value}
      </span>
    </div>
  );
}
