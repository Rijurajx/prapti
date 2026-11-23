'use client';

import { useState } from 'react';
import { saveDocumentStatus } from '@/app/profile/records-actions';
import type { DocumentStatusInput } from '@/lib/validation/finance-education-documents';
import { DOCUMENT_STATUS_VALUES } from '@/lib/validation/finance-education-documents';
import { StatusNotice } from '@/components/ui/status-notice';

export type DocumentRow = {
  code: string;
  name: string;
  category: string;
  isSensitive: boolean;
  description: string | null;
  status: (typeof DOCUMENT_STATUS_VALUES)[number] | null;
  note: string | null;
};

type DocumentStatus = (typeof DOCUMENT_STATUS_VALUES)[number];

const STATUS_LABELS: Record<DocumentStatus | '', string> = {
  available: 'Available',
  not_available: 'Not available',
  applied_for: 'Applied for or in progress',
  expired: 'Expired',
  unsure: 'Not sure',
  not_applicable: 'Not applicable',
  '': 'Not answered',
};

const CATEGORY_HEADINGS: Record<string, string> = {
  identity: 'Identity documents (availability only)',
  general: 'General',
  education: 'Education',
  employment: 'Employment',
  agriculture: 'Agriculture',
  disability: 'Disability',
  social: 'Social category',
  family: 'Family',
  financial: 'Financial',
};

function isDocumentStatus(value: string): value is DocumentStatus {
  return (DOCUMENT_STATUS_VALUES as readonly string[]).includes(value);
}

function groupByCategory(rows: DocumentRow[]): Array<{ category: string; items: DocumentRow[] }> {
  const groups: Array<{ category: string; items: DocumentRow[] }> = [];
  const index = new Map<string, number>();
  for (const row of rows) {
    const existing = index.get(row.category);
    if (existing === undefined) {
      index.set(row.category, groups.length);
      groups.push({ category: row.category, items: [row] });
    } else {
      const group = groups[existing] ?? { category: row.category, items: [] as DocumentRow[] };
      groups[existing] = group;
      group.items.push(row);
    }
  }
  return groups;
}

export function DocumentsForm({ rows }: { rows: DocumentRow[] }) {
  const [statuses, setStatuses] = useState<Record<string, DocumentRow['status']>>(() =>
    Object.fromEntries(rows.map((r) => [r.code, r.status])),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function handleChange(code: string, rawValue: string) {
    const previous = statuses[code] ?? null;

    if (rawValue === '') {
      setStatuses((prev) => ({ ...prev, [code]: null }));
      return;
    }
    if (!isDocumentStatus(rawValue)) {
      return;
    }

    const next: DocumentStatus = rawValue;
    setStatuses((prev) => ({ ...prev, [code]: next }));
    setError(null);
    setPending(code);

    const input: DocumentStatusInput = { documentCode: code, status: next, note: '' };
    const result = await saveDocumentStatus(input);

    setPending(null);
    if (result.ok) {
      return;
    }
    setStatuses((prev) => ({ ...prev, [code]: previous }));
    setError(result.error);
  }

  const groups = groupByCategory(rows);

  return (
    <div className="space-y-8">
      {error ? (
        <StatusNotice tone="danger" title="That change was not saved">
          {error}
        </StatusNotice>
      ) : null}

      {groups.map((group) => (
        <section key={group.category} className="space-y-3">
          <h2 className="text-lg font-semibold">
            {CATEGORY_HEADINGS[group.category] ?? group.category}
          </h2>
          <ul className="divide-y divide-border rounded-md border border-border">
            {group.items.map((row) => {
              const value = statuses[row.code] ?? '';
              return (
                <li
                  key={row.code}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{row.name}</p>
                    {row.description ? (
                      <p className="text-sm text-muted-foreground">{row.description}</p>
                    ) : null}
                    {row.isSensitive ? (
                      <p className="text-sm text-muted-foreground">
                        We record only whether you have it. Never enter the number.
                      </p>
                    ) : null}
                  </div>
                  <select
                    aria-label={row.name}
                    value={value}
                    disabled={pending === row.code}
                    onChange={(e) => handleChange(row.code, e.target.value)}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {(['', ...DOCUMENT_STATUS_VALUES] as const).map((option) => (
                      <option key={option || 'none'} value={option}>
                        {STATUS_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
