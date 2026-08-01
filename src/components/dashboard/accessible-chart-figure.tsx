/**
 * Spec §7 requires charts to use "accessible labels" and "not rely on
 * colours alone". Recharts' own accessibility support is inconsistent, so
 * rather than lean on partial ARIA attributes, every chart here renders its
 * SVG purely decoratively (aria-hidden) and is immediately followed by a
 * real, visually-hidden data table with the same label/value pairs — a
 * standards-based fallback any screen reader can read like any other table.
 * Charts also always print their values directly on the marks (never rely
 * on a color-to-legend lookup) — see the individual chart components.
 */
export function AccessibleChartFigure({
  title,
  caption,
  rows,
  children,
}: {
  title: string;
  caption?: string;
  rows: Array<{ label: string; value: string }>;
  children: React.ReactNode;
}) {
  return (
    <figure className="grid gap-2">
      <figcaption className="text-sm font-medium">{title}</figcaption>
      {caption ? (
        <p className="text-muted-foreground text-xs">{caption}</p>
      ) : null}
      <div aria-hidden="true">{children}</div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
