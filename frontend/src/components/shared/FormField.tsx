export function FormField({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-label-md text-on-surface">
      <span>{label}{required && <span aria-hidden="true"> *</span>}</span>
      {children}
      {error && <span role="alert" className="text-label-sm text-error">{error}</span>}
    </label>
  );
}
