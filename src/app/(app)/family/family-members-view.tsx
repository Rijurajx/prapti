'use client';

import { useState, useTransition } from 'react';
import {
  Users,
  UserPlus,
  User,
  Check,
  Trash2,
  Calendar,
  Sparkles,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { addFamilyMember, removeFamilyMember, switchActiveProfile } from './actions';
import type { Gender } from '@/lib/validation/profile';

export interface FamilyMemberItem {
  id: string;
  name: string;
  relationship: string;
  isSelf: boolean;
  categoryTags?: string[];
  dateOfBirth?: string | null;
  gender?: string | null;
  district?: string | null;
  state?: string | null;
}

interface FamilyMembersViewProps {
  activeCitizen: { id: string; name: string; relationship: string };
  familyMembers: FamilyMemberItem[];
}

const PRESET_RELATIONS = [
  'Father',
  'Mother',
  'Spouse',
  'Child',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Aunt',
  'Uncle',
  'Grandfather',
  'Grandmother',
];

export function FamilyMembersView({
  activeCitizen,
  familyMembers,
}: FamilyMembersViewProps) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Father');
  const [customRelation, setCustomRelation] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const finalRelationship = customRelation.trim() ? customRelation.trim() : relationship;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter the family member’s full name.');
      return;
    }

    if (!finalRelationship) {
      setError('Please select or specify their relationship.');
      return;
    }

    startTransition(async () => {
      const res = await addFamilyMember({
        name: name.trim(),
        relationship: finalRelationship,
        dateOfBirth: dateOfBirth || undefined,
        gender: (gender as Gender) || undefined,
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      // Reload window so the newly added member profile is active immediately
      window.location.reload();
    });
  };

  const handleSwitch = (citizenId: string) => {
    if (citizenId === activeCitizen.id) return;
    setSwitchingId(citizenId);
    startTransition(async () => {
      const res = await switchActiveProfile(citizenId);
      if (res.ok) {
        window.location.reload();
      } else {
        setError(res.error);
        setSwitchingId(null);
      }
    });
  };

  const handleRemove = (member: FamilyMemberItem) => {
    if (member.isSelf) return;
    if (!window.confirm(`Are you sure you want to remove ${member.name} (${member.relationship})?`)) {
      return;
    }

    startTransition(async () => {
      const res = await removeFamilyMember(member.id);
      if (res.ok) {
        window.location.reload();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl font-mono">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Family Members
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage benefit eligibility and application records for your entire family under one login.
        </p>
      </div>

      {/* Active Profile Highlight Banner */}
      <div className="border border-foreground bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {'//'} CURRENT ACTIVE BENEFICIARY
            </span>
          </div>
          <div className="text-base sm:text-lg font-bold text-foreground">
            Active: {activeCitizen.name} ({activeCitizen.relationship.toLowerCase()})
          </div>
          <p className="text-xs text-muted-foreground">
            The dashboard, matching schemes, and documents currently shown belong to this family profile.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-foreground text-background text-xs font-bold uppercase px-3 py-1.5 rounded-sm shrink-0">
          <Check className="h-3.5 w-3.5" />
          <span>Active Profile</span>
        </div>
      </div>

      {error && (
        <div className="border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Add New Family Member Form */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-foreground" />
            <CardTitle className="text-sm font-bold uppercase tracking-wide">
              Add New Family Member
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Only one account is required. Add family members with custom relations (e.g. Mother, Father, Aunt, Child).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMember} className="space-y-4 text-xs">
            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anita Sharma"
                className="w-full border border-border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
              />
            </div>

            {/* Relationship Preset Pills & Custom Input */}
            <div className="space-y-2">
              <label className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
                Relationship to You *
              </label>

              {/* Preset Quick Pills */}
              <div className="flex flex-wrap gap-1.5">
                {PRESET_RELATIONS.map((rel) => {
                  const isSelected = relationship === rel && !customRelation.trim();
                  return (
                    <button
                      key={rel}
                      type="button"
                      onClick={() => {
                        setRelationship(rel);
                        setCustomRelation('');
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-sm border transition-colors ${
                        isSelected
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-card text-foreground hover:border-foreground/60'
                      }`}
                    >
                      {rel}
                    </button>
                  );
                })}
              </div>

              {/* Custom Relation Field */}
              <div className="pt-1">
                <input
                  type="text"
                  value={customRelation}
                  onChange={(e) => setCustomRelation(e.target.value)}
                  placeholder="Or type custom relation (e.g. Sister-in-law, Aunt, Guardian)..."
                  className="w-full border border-border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
                />
              </div>
            </div>

            {/* Optional Basic Details for immediate scheme matching */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border">
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
                  Date of Birth (Optional)
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-foreground"
                />
                <p className="text-[10px] text-muted-foreground">Used to calculate age for pension & student grants.</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
                  Gender (Optional)
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender | '')}
                  className="w-full border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-foreground"
                >
                  <option value="">Select gender...</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="transgender">Transgender</option>
                  <option value="other">Other</option>
                </select>
                <p className="text-[10px] text-muted-foreground">Used for women-specific schemes like Annapurna Bhandar.</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="bg-foreground text-background font-bold text-xs uppercase px-5 py-2.5 rounded-sm hover:bg-black transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>{isPending ? 'Saving & Switching...' : '+ Save Family Member & Switch to Profile'}</span>
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Registered Family Members List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            {'//'} Registered Family Profiles ({familyMembers.length})
          </span>
          <span className="text-[11px] text-muted-foreground">
            Switch from here or via the top-bar dropdown.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {familyMembers.map((member) => {
            const isActive = member.id === activeCitizen.id;
            const isSwitching = switchingId === member.id;

            return (
              <Card
                key={member.id}
                className={`flex flex-col justify-between transition-colors border ${
                  isActive ? 'border-foreground bg-muted/20' : 'border-border hover:border-foreground/60'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-pixel text-[10px] uppercase px-2 py-0.5 border border-foreground bg-foreground text-background font-bold">
                      {member.relationship}
                    </span>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                        <Check className="h-3 w-3" /> Active Now
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base mt-2">{member.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {member.isSelf ? 'Primary Account Holder' : `Family Dependant (${member.relationship})`}
                  </CardDescription>
                  {member.categoryTags && member.categoryTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.categoryTags.map((tag) => (
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

                <CardContent className="pt-0 space-y-3">
                  {/* Metadata if present */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    {member.gender && <span className="capitalize">• {member.gender}</span>}
                    {member.dateOfBirth && <span>• DOB: {member.dateOfBirth}</span>}
                  </div>

                  {/* Actions */}
                  <div className="border-t border-border pt-3 flex items-center justify-between gap-2">
                    {isActive ? (
                      <span className="text-xs font-bold text-foreground">
                        ● Currently Viewing Profile
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isSwitching || isPending}
                        onClick={() => handleSwitch(member.id)}
                        className="bg-foreground text-background text-xs font-bold uppercase px-3 py-1.5 rounded-sm hover:bg-black transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <span>{isSwitching ? 'Switching...' : 'Switch to Profile'}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}

                    {!member.isSelf && (
                      <button
                        type="button"
                        title="Remove family member"
                        disabled={isPending}
                        onClick={() => handleRemove(member)}
                        className="text-muted-foreground hover:text-destructive p-1.5 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
