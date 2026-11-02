import { assessmentsContent } from "../content";
import { LightbulbIcon } from "./icons";

export function RememberCard({ tip }) {
  return (
    <aside className="flex items-center gap-5 rounded-lg bg-white p-4 shadow-md">
      <LightbulbIcon className="h-10 w-10 shrink-0 text-accent" />
      <div>
        <p className="text-sm font-semibold text-ink">
          {assessmentsContent.rememberLabel}
        </p>
        <p className="text-sm text-ink">{tip}</p>
      </div>
    </aside>
  );
}
