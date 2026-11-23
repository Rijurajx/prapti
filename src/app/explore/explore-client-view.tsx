'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ExternalLink,
  ArrowRight,
  X,
  FileText,
  Landmark,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SchemeItem {
  id: string;
  slug: string;
  name: string;
  name_bn: string | null;
  ministry_label: string | null;
  category: string;
  jurisdiction: string;
  state: string | null;
  portal_url: string | null;
  short_description: string | null;
  tags?: string[] | null;
  scheme_versions?: {
    benefit_summary_en: string | null;
  } | null;
}

interface ExploreClientViewProps {
  initialSchemes: SchemeItem[];
}

export function ExploreClientView({ initialSchemes }: ExploreClientViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');

  const filteredSchemes = initialSchemes.filter((scheme) => {
    const q = searchQuery.toLowerCase().trim();
    const tags = Array.isArray(scheme.tags) ? scheme.tags : [];

    const matchesSearch =
      !q ||
      scheme.name?.toLowerCase().includes(q) ||
      scheme.name_bn?.toLowerCase().includes(q) ||
      scheme.short_description?.toLowerCase().includes(q) ||
      scheme.ministry_label?.toLowerCase().includes(q) ||
      scheme.state?.toLowerCase().includes(q) ||
      tags.some((t) => t.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // State filter
    if (selectedState === 'central') {
      if (scheme.jurisdiction !== 'central') return false;
    } else if (selectedState !== 'all') {
      if (!scheme.state || scheme.state.toLowerCase() !== selectedState.toLowerCase()) {
        return false;
      }
    }

    // Category / Tag filter
    if (selectedTag === 'all') return true;
    if (selectedTag === 'food') {
      return (
        tags.includes('food_security') ||
        scheme.slug.includes('annapurna') ||
        scheme.name.toLowerCase().includes('annapurna') ||
        scheme.name.toLowerCase().includes('khadya')
      );
    }
    if (selectedTag === 'student') {
      return scheme.category === 'education' || tags.includes('student') || tags.includes('scholarship');
    }
    if (selectedTag === 'women') {
      return scheme.category === 'women' || tags.includes('women') || tags.includes('widow') || tags.includes('girl');
    }
    if (selectedTag === 'pension') {
      return tags.includes('elderly') || tags.includes('retired') || tags.includes('widow');
    }
    if (selectedTag === 'caste') {
      return tags.includes('sc') || tags.includes('st') || tags.includes('obc');
    }
    if (selectedTag === 'farmer') {
      return scheme.category === 'agriculture' || tags.includes('farmer');
    }
    if (selectedTag === 'health') {
      return scheme.category === 'health' || tags.includes('health') || tags.includes('healthcare');
    }
    if (selectedTag === 'livelihood') {
      return (
        tags.includes('employed') ||
        tags.includes('business') ||
        tags.includes('street_vendor') ||
        tags.includes('unemployed') ||
        tags.includes('self_employed') ||
        scheme.category === 'livelihood'
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search and State Filter Row */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword (e.g. Annapurna, scholarship, widow, farmer, health, loan)..."
              className="w-full rounded-[3px] border border-border bg-card pl-9 pr-8 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded-[3px] border border-border bg-card pl-3 pr-9 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-foreground uppercase font-bold cursor-pointer"
              aria-label="Filter by region or state"
            >
              <option value="all">ALL REGIONS (CENTRAL + 8 STATES)</option>
              <option value="central">CENTRAL GOVT (ALL INDIA)</option>
              <option value="West Bengal">WEST BENGAL</option>
              <option value="Maharashtra">MAHARASHTRA</option>
              <option value="Rajasthan">RAJASTHAN (ANNAPURNA)</option>
              <option value="Karnataka">KARNATAKA</option>
              <option value="Tamil Nadu">TAMIL NADU</option>
              <option value="Delhi">DELHI (NCT)</option>
              <option value="Uttar Pradesh">UTTAR PRADESH</option>
              <option value="Telangana">TELANGANA</option>
            </select>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { id: 'all', label: `All Schemes (${initialSchemes.length})` },
            { id: 'food', label: 'Annapurna & Food Security' },
            { id: 'student', label: 'Students & Scholarships' },
            { id: 'women', label: 'Women & Widows' },
            { id: 'pension', label: 'Elderly & Pensions' },
            { id: 'caste', label: 'SC / ST / OBC' },
            { id: 'farmer', label: 'Farmers & Agriculture' },
            { id: 'health', label: 'Healthcare & Insurance' },
            { id: 'livelihood', label: 'Employed, MSME & Livelihood' },
          ].map((chip) => {
            const isSelected = selectedTag === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedTag(chip.id)}
                className={`rounded px-2.5 py-1 text-xs font-bold uppercase transition-all ${
                  isSelected
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-card hover:bg-muted text-foreground/80 hover:text-foreground border border-border'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/80 pb-2 font-mono">
        <span>
          Showing <strong className="text-foreground">{filteredSchemes.length}</strong> of{' '}
          {initialSchemes.length} verified schemes
        </span>
        {(searchQuery || selectedState !== 'all' || selectedTag !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedState('all');
              setSelectedTag('all');
            }}
            className="text-foreground underline hover:text-muted-foreground font-bold"
          >
            Reset All Filters
          </button>
        )}
      </div>

      {/* Scheme Cards Grid */}
      {filteredSchemes.length === 0 ? (
        <div className="rounded border border-dashed border-border p-12 text-center text-xs space-y-3 bg-card">
          <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="font-bold text-foreground text-sm">No schemes match your selected filters</p>
          <p className="text-muted-foreground max-w-md mx-auto">
            Try adjusting your search keyword or switching the region dropdown to &quot;ALL REGIONS&quot;.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedState('all');
              setSelectedTag('all');
            }}
            className="mt-2 text-xs"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredSchemes.map((scheme) => {
            const version = scheme.scheme_versions;
            const tags = Array.isArray(scheme.tags) ? scheme.tags : [];

            return (
              <Card
                key={scheme.id}
                className="flex flex-col justify-between border-border hover:border-foreground transition-colors bg-card shadow-sm"
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span className="font-bold text-foreground">
                      {scheme.jurisdiction === 'central'
                        ? 'Central Scheme'
                        : scheme.state
                        ? `${scheme.state} Scheme`
                        : 'State Scheme'}
                    </span>
                    <span className="capitalize px-1.5 py-0.5 rounded bg-muted/60 text-foreground font-semibold">
                      {scheme.category}
                    </span>
                  </div>

                  <CardTitle className="text-base mt-2 font-bold text-foreground">
                    <Link href={`/schemes/${scheme.id}`} className="hover:underline">
                      {scheme.name}
                    </Link>
                  </CardTitle>

                  {scheme.name_bn && (
                    <p className="font-bengali text-xs text-muted-foreground">{scheme.name_bn}</p>
                  )}

                  {scheme.ministry_label && (
                    <CardDescription className="text-[11px] mt-0.5 line-clamp-1">
                      {scheme.ministry_label}
                    </CardDescription>
                  )}

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="rounded px-1.5 py-0.5 text-[9px] font-mono font-bold bg-muted text-foreground uppercase tracking-tight"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                    {scheme.short_description}
                  </p>

                  {version?.benefit_summary_en && (
                    <div className="border border-border bg-background p-2.5 text-xs text-foreground rounded-[3px]">
                      <span className="font-bold text-[10px] uppercase text-muted-foreground block mb-0.5">
                        {'//'} Benefit Overview
                      </span>
                      {version.benefit_summary_en}
                    </div>
                  )}

                  <div className="border-t border-border pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <Link
                      href={`/schemes/${scheme.id}`}
                      className="font-bold text-foreground hover:underline inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wide"
                    >
                      Inspect Rules &amp; Citations <ArrowRight className="h-3 w-3" />
                    </Link>
                    {scheme.portal_url && (
                      <a
                        href={scheme.portal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold font-mono uppercase bg-foreground text-background hover:bg-foreground/90 rounded-[3px] transition-colors shadow-sm"
                      >
                        Official Portal <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
