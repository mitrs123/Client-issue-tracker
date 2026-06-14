"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icon";
import { formatEnum } from "@/lib/format";

const STATUS = [
  "OPEN",
  "IN_REVIEW",
  "IN_PROGRESS",
  "WAITING_FOR_CLIENT",
  "RESOLVED",
  "CLOSED",
];
const SEVERITY = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TYPE = ["BUG", "FEEDBACK", "SUGGESTION", "IMPROVEMENT"];

export function IssuesFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`/issues?${next.toString()}`);
  }

  const hasFilters =
    sp.has("status") || sp.has("severity") || sp.has("type") || sp.has("search");

  function Select({
    name,
    label,
    options,
  }: {
    name: string;
    label: string;
    options: string[];
  }) {
    return (
      <div className="relative">
        <select
          value={sp.get(name) ?? ""}
          onChange={(e) => setParam(name, e.target.value)}
          className="cursor-pointer appearance-none rounded-lg border border-outline-variant/20 bg-surface-container-low px-4 py-2 pr-10 font-label-md text-label-md focus:border-tertiary focus:ring-0"
        >
          <option value="">{label}: All</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {formatEnum(o)}
            </option>
          ))}
        </select>
        <Icon
          name="expand_more"
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-sm">
      <Select name="status" label="Status" options={STATUS} />
      <Select name="severity" label="Severity" options={SEVERITY} />
      <Select name="type" label="Type" options={TYPE} />
      {hasFilters && (
        <button
          onClick={() => router.push("/issues")}
          className="flex items-center gap-1 px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <Icon name="filter_list_off" className="text-[18px]" />
          Clear Filters
        </button>
      )}
    </div>
  );
}
