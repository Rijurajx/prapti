'use client';

import { useState, useTransition } from 'react';
import { Tag, Check, Plus, X, Sparkles, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { updateCategoryTags } from './actions';

interface CategoryTagsSelectorProps {
  activeCitizen: {
    id: string;
    name: string;
    relationship: string;
    categoryTags?: string[];
  };
}

const PRESET_GROUPS = [
  {
    group: 'Social & Caste Category',
    tags: ['SC', 'ST', 'OBC', 'General', 'Minority'],
  },
  {
    group: 'Life Stage & Age',
    tags: ['Student', 'Scholarship', 'Teenage', 'Elder (60+)', 'Retired', 'Child'],
  },
  {
    group: 'Gender & Family Role',
    tags: ['Women', 'Girl', 'Widow'],
  },
  {
    group: 'Occupation & Livelihood',
    tags: ['Farmer', 'Artisan', 'BPL / Low Income', 'Employed', 'Unemployed', 'Self Employed'],
  },
  {
    group: 'Special Status',
    tags: ['Disabled / PwD'],
  },
];

export function CategoryTagsSelector({ activeCitizen }: CategoryTagsSelectorProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(
    activeCitizen.categoryTags ?? []
  );
  const [customTagInput, setCustomTagInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === tag.toLowerCase());
      if (exists) {
        return prev.filter((t) => t.toLowerCase() !== tag.toLowerCase());
      } else {
        return [...prev, tag];
      }
    });
    setSaveSuccess(false);
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = customTagInput.trim();
    if (!tag) return;
    if (selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setCustomTagInput('');
      return;
    }
    setSelectedTags((prev) => [...prev, tag]);
    setCustomTagInput('');
    setSaveSuccess(false);
  };

  const handleSave = () => {
    setError(null);
    setSaveSuccess(false);
    startTransition(async () => {
      const res = await updateCategoryTags(selectedTags);
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(res.error || 'Failed to save category tags');
      }
    });
  };

  return (
    <Card className="border border-border bg-card font-mono text-xs shadow-sm">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-foreground" />
              <CardTitle className="text-sm font-bold tracking-tight text-foreground uppercase">
                {'//'} Category & Eligibility Tags
              </CardTitle>
            </div>
            <CardDescription className="text-[11px] text-muted-foreground mt-1">
              Beneficiary: <strong className="text-foreground">{activeCitizen.name}</strong> ({activeCitizen.relationship})
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 animate-fadeIn">
                <Check className="h-3.5 w-3.5" /> Saved & Evaluated
              </span>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="bg-foreground text-background font-bold text-xs uppercase px-3 py-1.5 hover:bg-black transition-colors"
            >
              {isPending ? 'Saving...' : 'Save Tags'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {error && (
          <div className="rounded border border-destructive/50 bg-destructive/10 p-2 text-destructive text-[11px]">
            {error}
          </div>
        )}

        {/* Informative helper box */}
        <div className="rounded border border-border bg-muted/30 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
          <p>
            An individual can hold multiple identity tags simultaneously (for example: <strong className="text-foreground">ST</strong>, <strong className="text-foreground">Widow</strong>, and <strong className="text-foreground">Retired</strong>).
            These tags directly feed into the deterministic rule matching engine across 17+ verified Central and West Bengal welfare schemes and scholarships.
          </p>
        </div>

        {/* Selected Tags summary */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Active Tags ({selectedTags.length}):
          </span>
          <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 rounded bg-muted/20 border border-border">
            {selectedTags.length === 0 ? (
              <span className="text-[11px] text-muted-foreground italic">
                No tags selected yet. Click any pill below to assign categories.
              </span>
            ) : (
              selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded bg-foreground text-background px-2 py-0.5 text-xs font-black uppercase tracking-tight"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="hover:opacity-75 focus:outline-none"
                    title={`Remove ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Categorized Pill Groups */}
        <div className="space-y-3 pt-1">
          {PRESET_GROUPS.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                {'//'} {grp.group}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {grp.tags.map((tag) => {
                  const isSelected = selectedTags.some(
                    (t) => t.toLowerCase() === tag.toLowerCase()
                  );
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold uppercase transition-all ${
                        isSelected
                          ? 'bg-foreground text-background shadow-sm border border-foreground'
                          : 'bg-muted/50 hover:bg-muted text-foreground/80 hover:text-foreground border border-border'
                      }`}
                    >
                      {isSelected ? <Check className="h-3 w-3 stroke-[3]" /> : <Plus className="h-3 w-3 text-muted-foreground" />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Custom Tag Input */}
        <form onSubmit={handleAddCustomTag} className="pt-2 border-t border-border flex items-center gap-2">
          <input
            type="text"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            placeholder="Add custom category tag (e.g. Daily Wage Worker)..."
            className="flex-1 rounded-[3px] border border-border bg-background px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-foreground"
          />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={!customTagInput.trim()}
            className="text-xs uppercase font-bold"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Tag
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
