export function Card({ className = '', children }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, actions }) {
  return (
    <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className = '', children }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

export function Badge({ variant = 'default', children }) {
  const base =
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';
  const variants = {
    default: 'bg-slate-50 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200'
  };
  return <span className={`${base} ${variants[variant]}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  if (!status) return null;
  const map = {
    CONFIDENCE_VALIDATED: { label: 'Confidence Validated', variant: 'success' },
    OVERCONFIDENT: { label: 'Overconfident', variant: 'danger' },
    UNDERCONFIDENT: { label: 'Underconfident', variant: 'warning' },
    PARTIALLY_ALIGNED: { label: 'Partially Aligned', variant: 'info' },
    NO_CONFIDENCE_DATA: { label: 'No Confidence Data', variant: 'default' }
  };
  const v = map[status] || { label: status, variant: 'default' };
  return <Badge variant={v.variant}>{v.label}</Badge>;
}

export function ProgressBar({ value, max = 100 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Pill({ children }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
      {children}
    </span>
  );
}

