import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  placeholder,
}: {
  label: string;
  value: string | null;
  placeholder?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-muted-foreground text-xs font-medium">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {value !== null ? (
          <span className="text-lg font-semibold">{value}</span>
        ) : (
          <span className="text-muted-foreground text-xs">{placeholder}</span>
        )}
      </CardContent>
    </Card>
  );
}
