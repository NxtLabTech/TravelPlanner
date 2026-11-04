# TravelPlanner — Frontend Design Tokens & Style Reference Guide

This reference guide documents the design tokens, typography scale, component classes, and SVG icons for the React 19 + Tailwind CSS frontend.

---

## 1. Tailwind CSS v4 Theme Configuration

Add the following tokens to `frontend/src/index.css`:

```css
@import "tailwindcss";

@theme {
  /* Brand Primary Palette (Sky) */
  --color-brand-50: #F0F9FF;
  --color-brand-100: #E0F2FE;
  --color-brand-200: #BAE6FD;
  --color-brand-500: #0EA5E9;
  --color-brand-600: #0284C7;
  --color-brand-700: #0369A1;
  --color-brand-800: #075985;
  --color-brand-900: #0C4A6E;

  /* Semantic Status Tokens */
  --color-status-upcoming-bg: #FFFBEB;
  --color-status-upcoming-border: #FDE68A;
  --color-status-upcoming-text: #92400E;
  --color-status-upcoming-dot: #F59E0B;

  --color-status-ongoing-bg: #ECFDF5;
  --color-status-ongoing-border: #A7F3D0;
  --color-status-ongoing-text: #065F46;
  --color-status-ongoing-dot: #10B981;

  --color-status-completed-bg: #F1F5F9;
  --color-status-completed-border: #CBD5E1;
  --color-status-completed-text: #334155;
  --color-status-completed-dot: #94A3B8;

  /* Typography */
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

---

## 2. Semantic Status Badge Styling

| Status | Tone Meaning | Background Class | Text Class | Border Class | Indicator Dot |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Upcoming** | Informational / Warning | `bg-amber-50` (`#FFFBEB`) | `text-amber-800` (`#92400E`) | `border-amber-200` (`#FDE68A`) | `bg-amber-500` |
| **Ongoing** | Active / Success | `bg-emerald-50` (`#ECFDF5`) | `text-emerald-800` (`#065F46`) | `border-emerald-200` (`#A7F3D0`) | `bg-emerald-500` (pulsing) |
| **Completed** | Muted / Neutral | `bg-slate-100` (`#F1F5F9`) | `text-slate-700` (`#334155`) | `border-slate-300` (`#CBD5E1`) | `bg-slate-400` |

### StatusBadge Component Pattern

```jsx
const statusConfig = {
  upcoming: {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  ongoing: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500 animate-pulse",
  },
  completed: {
    badge: "bg-slate-100 text-slate-700 border-slate-300",
    dot: "bg-slate-400",
  },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.completed;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      <span className="capitalize">{status}</span>
    </span>
  );
}
```

---

## 3. Form Input & Validation Ergonomics

### Standard Input Class
```css
w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all min-h-[44px]
```

### Invalid / Error Input Class
```css
border-rose-500 bg-rose-50/20 text-rose-900 placeholder:text-rose-300 focus:border-rose-500 focus:ring-rose-500/20
```

### Button Classes
- **Primary Button**: `inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-sm font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-50 min-h-[44px]`
- **Secondary Button**: `inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 min-h-[44px]`
- **Destructive Button**: `inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 min-h-[44px]`

---

## 4. Responsive Breakpoint Guidelines

- **Mobile (`375px`)**: Single-column vertical layout, 100% width form inputs, minimum 44x44px touch targets (`min-h-[44px]`), bottom-sheet drawer for activity scheduling.
- **Tablet (`768px`)**: 2-column trip card grid, 2-column date input fields, 540px centered modal dialog.
- **Desktop (`1280px`)**: 3-column trip card grid, max container width `max-w-6xl`, side-by-side trip overview and timeline, 560px centered modal dialog.

