'use client';

import { useState, useTransition } from 'react';
import { Bell, Plus, Check, Trash2, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  createReminder,
  toggleReminderDismissed,
  deleteReminder,
} from './actions';

interface ReminderItem {
  id: string;
  title: string;
  kind: 'deadline' | 'follow_up' | 'renewal' | 'task';
  due_at: string;
  is_dismissed: boolean;
  channel: string;
}

interface RemindersViewProps {
  reminders: ReminderItem[];
}

export function RemindersView({ reminders }: RemindersViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrorMsg(null);

    startTransition(async () => {
      const res = await createReminder(formData);
      if (res.ok) {
        setShowAddForm(false);
      } else {
        setErrorMsg(res.error);
      }
    });
  };

  const handleToggle = (id: string, currentDismissed: boolean) => {
    startTransition(async () => {
      await toggleReminderDismissed(id, !currentDismissed);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteReminder(id);
    });
  };

  const activeReminders = reminders.filter((r) => !r.is_dismissed);
  const completedReminders = reminders.filter((r) => r.is_dismissed);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          {showAddForm ? 'Cancel' : 'Add Reminder'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-sm">Create New Reminder</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
              <div>
                <label className="text-xs font-medium text-foreground">Reminder Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Submit Form K2 at school office, BDO camp visit"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-foreground">Due Date</label>
                  <input
                    type="date"
                    name="dueAt"
                    required
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Type</label>
                  <select
                    name="kind"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    <option value="deadline">Official Deadline</option>
                    <option value="follow_up">Application Follow-up</option>
                    <option value="task">Preparation Task</option>
                    <option value="renewal">Annual Renewal</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="submit" size="sm" disabled={isPending}>
                  Save Reminder
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Reminders */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Upcoming ({activeReminders.length})
        </h2>
        {activeReminders.length === 0 ? (
          <p className="text-xs text-muted-foreground">No upcoming reminders.</p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {activeReminders.map((r) => {
              const formattedDate = new Date(r.due_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div key={r.id} className="flex items-center justify-between p-3 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggle(r.id, r.is_dismissed)}
                      disabled={isPending}
                      className="flex h-5 w-5 items-center justify-center rounded border border-border text-transparent hover:border-primary hover:text-primary"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <div>
                      <p className="font-medium text-foreground">{r.title}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Due {formattedDate}</span>
                        <span>•</span>
                        <span className="capitalize">{r.kind.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(r.id)}
                      disabled={isPending}
                      className="text-muted-foreground hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Reminders */}
      {completedReminders.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Completed ({completedReminders.length})
          </h2>
          <div className="divide-y divide-border rounded-lg border border-border bg-card/60">
            {completedReminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 text-xs opacity-75">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggle(r.id, r.is_dismissed)}
                    disabled={isPending}
                    className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <p className="line-through text-muted-foreground">{r.title}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(r.id)}
                  disabled={isPending}
                  className="text-muted-foreground hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

