'use client';

import { useMemo, useRef, useState } from 'react';
import { AreaChart, ChartNoAxesColumnIncreasing, HandCoins, WalletCards } from 'lucide-react';

type MetricKey = 'totalAssets' | 'totalDeductions' | 'netZakatable' | 'zakatPayable';

type YearlyPoint = {
  yearLabel: string;
  totalAssets: number;
  totalDeductions: number;
  netZakatable: number;
  zakatPayable: number;
};

type MetricConfig = {
  key: MetricKey;
  icon: typeof WalletCards;
  labelEn: string;
  labelUr: string;
  stroke: string;
  fill: string;
};

const metricConfigs: MetricConfig[] = [
  {
    key: 'totalAssets',
    icon: WalletCards,
    labelEn: 'Total Assets',
    labelUr: 'کل اثاثے',
    stroke: '#0b8f5f',
    fill: 'rgba(11,143,95,0.16)'
  },
  {
    key: 'totalDeductions',
    icon: ChartNoAxesColumnIncreasing,
    labelEn: 'Total Liabilities',
    labelUr: 'کل واجبات',
    stroke: '#0f766e',
    fill: 'rgba(15,118,110,0.16)'
  },
  {
    key: 'netZakatable',
    icon: AreaChart,
    labelEn: 'Net Assets',
    labelUr: 'خالص اثاثے',
    stroke: '#2563eb',
    fill: 'rgba(37,99,235,0.14)'
  },
  {
    key: 'zakatPayable',
    icon: HandCoins,
    labelEn: 'Zakat Payable',
    labelUr: 'زکوٰۃ قابلِ ادا',
    stroke: '#7c3aed',
    fill: 'rgba(124,58,237,0.15)'
  }
];

function toChartPoints(values: number[], width: number, height: number) {
  if (!values.length) return '';
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const left = 40;
  const right = width - 20;
  const top = 20;
  const bottom = height - 36;
  const xStep = values.length > 1 ? (right - left) / (values.length - 1) : 0;
  return values
    .map((value, i) => {
      const x = left + i * xStep;
      const y = bottom - ((value - min) / range) * (bottom - top);
      return `${x},${y}`;
    })
    .join(' ');
}

export function YearlyMetricsDashboard({ locale, points }: { locale: string; points: YearlyPoint[] }) {
  const isUr = locale === 'ur';
  const [selected, setSelected] = useState<MetricKey>('zakatPayable');
  const chartRefs = useRef<Partial<Record<MetricKey, HTMLDivElement | null>>>({});
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(isUr ? 'ur-PK' : 'en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
    [isUr]
  );

  const sorted = useMemo(
    () =>
      [...points].sort((a, b) => {
        const aNum = Number(a.yearLabel);
        const bNum = Number(b.yearLabel);
        if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
        return a.yearLabel.localeCompare(b.yearLabel);
      }),
    [points]
  );

  if (!sorted.length) {
    return (
      <section className="card">
        <h2 className="text-lg font-semibold">{isUr ? 'سالانہ ڈیش بورڈ' : 'Yearly Dashboard'}</h2>
        <p className="mt-2 text-sm text-slate-500">
          {isUr ? 'چارٹ دیکھنے کے لیے پہلے کوئی ریکارڈ محفوظ کریں۔' : 'Save at least one record to view dashboard charts.'}
        </p>
      </section>
    );
  }

  function focusChart(metric: MetricKey) {
    setSelected(metric);
    const target = chartRefs.current[metric];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    target.focus({ preventScroll: true });
  }

  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricConfigs.map((metric) => {
          const Icon = metric.icon;
          const metricValues = sorted.map((point) => point[metric.key]);
          const value = metricValues[metricValues.length - 1] || 0;
          const isActive = metric.key === selected;
          return (
            <button
              key={metric.key}
              type="button"
              onClick={() => focusChart(metric.key)}
              className={`card text-left transition ${isActive ? 'ring-2 ring-brand/40' : 'hover:border-brand/40 hover:shadow-md'}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">{isUr ? metric.labelUr : metric.labelEn}</p>
                <Icon size={18} color={metric.stroke} />
              </div>
              <p className="text-xl font-semibold">{formatter.format(value)}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {metricConfigs.map((metric) => {
          const values = sorted.map((point) => point[metric.key]);
          const latest = values[values.length - 1] || 0;
          const pointsString = toChartPoints(values, 760, 280);
          const areaString = pointsString ? `${pointsString} 740,244 40,244` : '';
          return (
            <div
              key={`chart-${metric.key}`}
              ref={(el) => {
                chartRefs.current[metric.key] = el;
              }}
              tabIndex={-1}
              className={`card overflow-x-auto outline-none transition ${selected === metric.key ? 'ring-2 ring-brand/40' : ''}`}
            >
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h3 className="font-semibold">{isUr ? metric.labelUr : metric.labelEn}</h3>
                <p className="text-sm text-slate-500">
                  {isUr ? 'تازہ ترین' : 'Latest'}: <span className="font-semibold text-slate-800">{formatter.format(latest)}</span>
                </p>
              </div>
              <svg viewBox="0 0 760 280" className="h-72 w-full min-w-[560px]">
                <line x1="40" y1="244" x2="740" y2="244" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="40" y1="20" x2="40" y2="244" stroke="#cbd5e1" strokeWidth="1" />
                {areaString ? <polygon points={areaString} fill={metric.fill} /> : null}
                {pointsString ? <polyline fill="none" stroke={metric.stroke} strokeWidth="3" points={pointsString} strokeLinejoin="round" strokeLinecap="round" /> : null}
                {sorted.map((point, idx) => {
                  const max = Math.max(...values, 1);
                  const min = Math.min(...values, 0);
                  const range = Math.max(max - min, 1);
                  const left = 40;
                  const right = 740;
                  const top = 20;
                  const bottom = 244;
                  const xStep = sorted.length > 1 ? (right - left) / (sorted.length - 1) : 0;
                  const x = left + idx * xStep;
                  const y = bottom - ((point[metric.key] - min) / range) * (bottom - top);
                  return (
                    <g key={`${point.yearLabel}-${metric.key}`}>
                      <circle cx={x} cy={y} r="4.5" fill={metric.stroke} />
                      <text x={x} y={266} textAnchor="middle" fontSize="12" fill="#64748b">
                        {point.yearLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          );
        })}
      </div>
    </section>
  );
}
