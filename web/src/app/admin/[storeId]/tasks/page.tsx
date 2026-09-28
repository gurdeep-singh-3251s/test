"use client";

import { useParams } from "next/navigation";
import { Field, PageHead, Panel, inputClass } from "@/components/admin/ui";
import { useAdminList } from "@/components/admin/use-admin";
import { adminApi } from "@/lib/admin-api";

type Task = {
  id: string;
  title: string;
  kind: string;
  cadence: string;
  lastRun: string | null;
  nextRun: string;
  active: boolean;
};

export default function TasksPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { data, error, create, reload } = useAdminList<Task[]>(storeId, "tasks");

  return (
    <div className="grid gap-6">
      <div>
        <PageHead title="Reminders" note="Things to do again: pay staff, pay power, order stock." />
      </div>
      <Panel title="Add a reminder">
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void create({
              title: form.get("title"),
              kind: form.get("kind"),
              cadence: form.get("cadence"),
              lastRun: null,
              nextRun: new Date().toISOString(),
              active: true,
            });
            event.currentTarget.reset();
          }}
        >
          <Field label="Title"><input name="title" required className={inputClass} /></Field>
          <Field label="Kind"><input name="kind" defaultValue="ops" className={inputClass} /></Field>
          <Field label="Cadence">
            <select name="cadence" className={inputClass}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>
          <button className="self-end rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white">Add reminder</button>
        </form>
      </Panel>
      {error ? <p className="text-rose-600">{error}</p> : null}
      <Panel title="Schedule">
        {(data ?? []).map((task) => (
          <article key={task.id} className="grid items-center gap-3 border-b border-slate-100 py-3 md:grid-cols-[1.4fr_1fr_auto]">
            <div>
              <p>{task.title}</p>
              <p className="text-xs text-slate-500">{task.kind} · {task.cadence}</p>
            </div>
            <p className="text-sm text-slate-500">
              Next {task.nextRun.slice(0, 10)}
              {task.lastRun ? ` · last ${task.lastRun.slice(0, 10)}` : ""}
            </p>
            <button
              className="text-sm text-teal-700"
              onClick={async () => {
                await adminApi.runTask(storeId, task.id);
                await reload();
              }}
            >
              Run now
            </button>
          </article>
        ))}
      </Panel>
    </div>
  );
}
