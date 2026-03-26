export function Card({ className = '', children }) {
  return (
    <div className={`glass-card bg-white/80 dark:bg-dark-card/90 rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, actions }) {
  return (
    <div className="px-6 py-5 border-b border-slate-200/50 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/30 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className = '', children }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function Badge({ variant = 'default', children }) {
  const base =
    'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border';
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30',
    warning: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30',
    danger: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/30',
    info: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800/30'
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
    <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden border border-slate-200/50 dark:border-slate-600/30">
      <div
        className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
          pct >= 80 ? 'from-emerald-400 to-emerald-500' :
          pct >= 50 ? 'from-amber-400 to-amber-500' :
          'from-rose-400 to-rose-500'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Pill({ children }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-border">
      {children}
    </span>
  );
}

