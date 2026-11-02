import Link from "next/link";
import { PROGRESS_COLORS } from "./ProgressData";

export function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-[#F6F7FC] p-4 sm:p-6 lg:p-8 flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {children}
    </div>
  );
}

export function BackLink() {
  return (
    <Link
      href="/progress"
      className="text-xs text-gray-500 hover:text-[#1B2269] w-fit"
    >
      &larr; Back to Progress
    </Link>
  );
}

export function Card({ children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-8 flex flex-col gap-5">
      {children}
    </div>
  );
}

const BADGE_TONES = {
  navy: "bg-[#E8EAFB] text-[#1B2269]",
  red: "bg-[#FDE8EA] text-[#C62828]",
};

export function Badge({ children, tone = "navy" }) {
  return (
    <span
      className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function CardHeader({ title, badge, badgeTone }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base sm:text-lg font-bold text-gray-900">{title}</h2>
      {badge && <Badge tone={badgeTone}>{badge}</Badge>}
    </div>
  );
}

export function ProgressBar({ percent, color, heightClass = "h-1.5" }) {
  return (
    <div
      className={`w-full rounded-full overflow-hidden ${heightClass}`}
      style={{ backgroundColor: PROGRESS_COLORS.track }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function SubjectTile({
  icon,
  name,
  value,
  valueColor,
  barColor,
  percent,
  caption,
}) {
  return (
    <div className="bg-[#F4F5FA] rounded-xl border-l-4 border-[#1B2269] p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
        <span aria-hidden="true">{icon}</span>
        <span>{name}</span>
      </div>
      <div className="text-2xl font-extrabold" style={{ color: valueColor }}>
        {value}
      </div>
      <ProgressBar percent={percent} color={barColor} />
      <div className="text-[11px] text-gray-400">{caption}</div>
    </div>
  );
}
