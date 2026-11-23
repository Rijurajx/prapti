'use client';

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  Layers,
  FileCheck2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PraptiLogo } from '@/components/prapti-logo';
import {
  processAssistantMessage,
  confirmAndSaveFacts,
  type AssistantSuccessResult,
} from './actions';
import type { ExtractedFacts } from '@/services/gemini';

export interface AssistantChatProps {
  activeCitizen?: {
    id: string;
    name: string;
    relationship: string;
    categoryTags?: string[];
  };
  familyMembers?: Array<{
    id: string;
    name: string;
    relationship: string;
    isSelf?: boolean;
  }>;
  citizenState?: string | null;
  eligibleCount?: number;
  readyDocsCount?: number;
  totalDocsCount?: number;
  onSwitchProfile?: (memberId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  extractedFacts?: ExtractedFacts | null;
  confirmed?: boolean;
  referencedSchemes?: AssistantSuccessResult['referencedSchemes'];
  suggestedFollowUps?: string[];
}

const STORAGE_PREFIX = 'prapti_chat_v1_';
const MAX_STORED_MESSAGES = 25; // keep last 25 messages per citizen to conserve quota

function getWelcomeMessage(activeCitizen: AssistantChatProps['activeCitizen']): ChatMessage {
  return {
    id: 'welcome',
    sender: 'assistant',
    text: `Hello! I am **Prapti AI**, your personal benefits companion with complete context for **${activeCitizen?.name ?? 'Citizen'}** (${(activeCitizen?.relationship ?? 'self').toUpperCase()}).\n\n` +
      `I know what documents you have ready, what criteria you meet, and which schemes you can apply for right now across Central & State governments.\n\n` +
      `Ask me anything — for example:\n` +
      `* *"What schemes am I eligible for?"*\n` +
      `* *"Why am I not eligible for Swami Vivekananda Scholarship (SVMCM)?"*\n` +
      `* *"What documents am I missing?"*\n` +
      `* *"How can I get Annapurna / Ladki Bahin / PM-KISAN benefits?"*`,
    suggestedFollowUps: [
      'What schemes am I eligible for?',
      'What documents am I missing?',
      'Why am I not eligible for some schemes?',
    ],
  };
}

function loadStoredChat(citizenId: string, activeCitizen: AssistantChatProps['activeCitizen']): ChatMessage[] {
  if (typeof window === 'undefined' || !citizenId) {
    return [getWelcomeMessage(activeCitizen)];
  }
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + citizenId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse issues
  }
  return [getWelcomeMessage(activeCitizen)];
}

function saveChatWithAutoPrune(citizenId: string, msgs: ChatMessage[]) {
  if (typeof window === 'undefined' || !citizenId) return;
  const key = STORAGE_PREFIX + citizenId;

  // 1. Cap to MAX_STORED_MESSAGES (keep first welcome + recent messages)
  let toSave = msgs;
  if (toSave.length > MAX_STORED_MESSAGES) {
    const first = toSave[0]!;
    const recent = toSave.slice(-(MAX_STORED_MESSAGES - 1));
    toSave = [first, ...recent];
  }

  // 2. Try saving; if localStorage is getting full (QuotaExceededError), automatically prune older chats
  try {
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch {
    console.warn('[AI Chat Storage] Quota limit encountered. Automatically pruning older chats to free storage...');
    try {
      // Aggressively prune to recent 10 messages
      toSave = [toSave[0]!, ...toSave.slice(-10)];
      localStorage.setItem(key, JSON.stringify(toSave));
    } catch {
      // If still failing, purge older chat history of other citizens to free quota
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(STORAGE_PREFIX) && k !== key) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(key, JSON.stringify(toSave));
      } catch {
        // Storage genuinely blocked, continue in-memory safely
      }
    }
  }
}

export function AssistantChat({
  activeCitizen = { id: '', name: 'Citizen', relationship: 'self', categoryTags: [] },
  familyMembers = [],
  citizenState = 'West Bengal',
  eligibleCount = 0,
  readyDocsCount = 0,
  totalDocsCount = 0,
  onSwitchProfile,
}: AssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadStoredChat(activeCitizen.id, activeCitizen),
  );

  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentCitizenIdRef = useRef<string>(activeCitizen.id);

  // Auto-save to localStorage whenever messages change
  useEffect(() => {
    if (activeCitizen.id) {
      saveChatWithAutoPrune(activeCitizen.id, messages);
    }
  }, [messages, activeCitizen.id]);

  // When active citizen switches, load their stored history or reset context
  useEffect(() => {
    if (currentCitizenIdRef.current !== activeCitizen.id) {
      currentCitizenIdRef.current = activeCitizen.id;
      const stored = loadStoredChat(activeCitizen.id, activeCitizen);

      const switchNotice: ChatMessage = {
        id: Date.now().toString(),
        sender: 'system',
        text: `🔄 Switched context to **${activeCitizen.name}** (${activeCitizen.relationship.toUpperCase()}). Active schemes and document evaluation reloaded.`,
      };

      setMessages([...stored, switchNotice]);
    }
  }, [activeCitizen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPending]);

  const handleClearChat = useCallback(() => {
    if (!window.confirm(`Clear chat history for ${activeCitizen.name}?`)) return;
    try {
      localStorage.removeItem(STORAGE_PREFIX + activeCitizen.id);
    } catch {}
    setMessages([getWelcomeMessage(activeCitizen)]);
  }, [activeCitizen]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isPending) return;

    const userMsgId = Date.now().toString();
    setMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text }]);
    setInput('');

    // Prepare history for LLM
    const history = messages
      .filter((m) => m.sender === 'user' || m.sender === 'assistant')
      .slice(-6)
      .map((m) => ({ sender: m.sender as 'user' | 'assistant', text: m.text }));

    startTransition(async () => {
      const res = await processAssistantMessage(text, activeCitizen.id, history);
      if (res.ok) {
        const assistantMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            sender: 'assistant',
            text: res.reply,
            extractedFacts: res.facts,
            confirmed: false,
            referencedSchemes: res.referencedSchemes,
            suggestedFollowUps: res.suggestedFollowUps,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: 'I encountered an issue processing your query. Please try again or rephrase your question.',
          },
        ]);
      }
    });
  };

  const handleConfirm = (msgId: string, facts: ExtractedFacts) => {
    startTransition(async () => {
      const res = await confirmAndSaveFacts(facts, activeCitizen.id);
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, confirmed: true } : m)),
        );
      }
    });
  };

  // Helper to format text with lightweight markdown formatting
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }

          // Headers
          if (line.startsWith('#### ')) {
            return (
              <h4 key={idx} className="font-bold text-xs uppercase tracking-wider text-foreground mt-2">
                {line.replace('#### ', '')}
              </h4>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="font-bold text-sm text-foreground mt-2.5 pb-0.5 border-b border-border/40">
                {line.replace('### ', '')}
              </h3>
            );
          }

          // Bullet points
          if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            const content = line.trim().replace(/^[\*\-]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1 text-xs">
                <span className="text-muted-foreground select-none">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
              </div>
            );
          }

          return (
            <p
              key={idx}
              className="text-xs"
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }}
            />
          );
        })}
      </div>
    );
  };

  // Format bold, italics, code, links
  const formatInlineMarkdown = (str: string) => {
    let out = str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-muted rounded text-[11px] font-mono">$1</code>')
      .replace(
        /\[(.*?)\]\((https?:\/\/.*?)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline font-medium hover:text-primary/80 inline-flex items-center gap-0.5">$1 ↗</a>',
      );
    return out;
  };

  const starterChips = getDynamicStarterPrompts(activeCitizen);

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] min-h-[550px] rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      {/* Telemetry Header Bar: Shows Active Beneficiary Profile & Document Stats */}
      <div className="border-b border-border bg-muted/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Beneficiary Solid Black/White Badge with Non-Disappearing Hover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
              className="bg-foreground text-background font-mono font-bold text-[11px] uppercase px-2.5 py-1 rounded-[3px] flex items-center gap-1.5 hover:bg-black/90 dark:hover:bg-white/90 dark:hover:text-black transition-colors shadow-sm cursor-pointer border border-foreground"
              title="Switch Active Beneficiary Context"
            >
              <User className="h-3 w-3 shrink-0" />
              <span>[USER: {activeCitizen.name.toUpperCase()} ({activeCitizen.relationship.toUpperCase()})]</span>
              {familyMembers.length > 1 && (
                <ChevronDown className="h-3 w-3 shrink-0" />
              )}
            </button>

            {memberDropdownOpen && familyMembers.length > 1 && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMemberDropdownOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1.5 w-64 rounded-md border border-border bg-popover p-1.5 shadow-lg z-50 text-xs font-mono">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground border-b border-border mb-1">
                    Switch Beneficiary Context
                  </div>
                  {familyMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setMemberDropdownOpen(false);
                        if (onSwitchProfile && m.id !== activeCitizen.id) {
                          onSwitchProfile(m.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-left transition-colors ${
                        m.id === activeCitizen.id
                          ? 'bg-foreground text-background font-bold'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <span className="truncate">{m.name}</span>
                      <span className="text-[10px] uppercase opacity-75">({m.relationship})</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <span className="text-muted-foreground font-mono text-[11px] hidden sm:inline">
            {'//'} State: <strong className="text-foreground">{citizenState || 'All India'}</strong>
          </span>

          {(activeCitizen.categoryTags ?? []).length > 0 && (
            <div className="hidden md:flex items-center gap-1">
              {(activeCitizen.categoryTags ?? []).slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-card text-muted-foreground"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Live Metrics Telemetry & Clear History Button */}
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <div className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <strong className="text-foreground">{eligibleCount}</strong>
            <span className="text-muted-foreground">Eligible</span>
          </div>
          <div className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-0.5">
            <FileCheck2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-foreground font-bold">{readyDocsCount}/{totalDocsCount}</span>
            <span className="text-muted-foreground">Docs Ready</span>
          </div>
          <button
            type="button"
            onClick={handleClearChat}
            className="text-muted-foreground hover:text-foreground text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-border bg-card flex items-center gap-1 hover:border-foreground transition-colors cursor-pointer"
            title="Reset conversation history for this member"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="rounded-full border border-border bg-muted/60 px-3 py-1 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                  <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(msg.text) }} />
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] bg-foreground text-background">
                  <PraptiLogo className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[78%] space-y-3 rounded-lg p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-foreground text-background font-mono'
                    : 'bg-muted/30 text-foreground border border-border/80'
                }`}
              >
                {/* Formatted Markdown Content */}
                {renderFormattedText(msg.text)}

                {/* Referenced Schemes Mini-Cards */}
                {msg.referencedSchemes && msg.referencedSchemes.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-border/70 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1">
                      <Layers className="h-3 w-3 text-primary" /> Schemes Referenced ({msg.referencedSchemes.length}):
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {msg.referencedSchemes.map((s, idx) => (
                        <div
                          key={idx}
                          className="rounded border border-border bg-card p-2 text-[11px] flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  s.status === 'eligible'
                                    ? 'bg-emerald-500'
                                    : s.status === 'needs_documents'
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                              <strong className="text-foreground">{s.name}</strong>
                            </div>
                            {s.benefit && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                {s.benefit}
                              </p>
                            )}
                          </div>
                          {s.portalUrl && (
                            <a
                              href={s.portalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold uppercase text-primary hover:underline shrink-0 inline-flex items-center gap-0.5"
                            >
                              Portal ↗
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structured Extracted Facts Confirmation Card */}
                {msg.extractedFacts && (
                  <div className="mt-3 rounded-md border border-border bg-background p-3 text-xs text-foreground space-y-2.5">
                    <div className="flex items-center gap-1.5 font-semibold text-primary font-mono text-[11px]">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Extracted Facts for {activeCitizen.name} (Pending Your Confirmation)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {msg.extractedFacts.age && (
                        <div className="rounded bg-muted/40 p-1.5">
                          <span className="text-muted-foreground">Age: </span>
                          <strong>{msg.extractedFacts.age} years</strong>
                        </div>
                      )}
                      {msg.extractedFacts.gender && (
                        <div className="rounded bg-muted/40 p-1.5">
                          <span className="text-muted-foreground">Gender: </span>
                          <strong className="capitalize">{msg.extractedFacts.gender}</strong>
                        </div>
                      )}
                      {msg.extractedFacts.maritalStatus && (
                        <div className="rounded bg-muted/40 p-1.5">
                          <span className="text-muted-foreground">Marital Status: </span>
                          <strong className="capitalize">
                            {msg.extractedFacts.maritalStatus.replace('_', ' ')}
                          </strong>
                        </div>
                      )}
                      {msg.extractedFacts.state && (
                        <div className="rounded bg-muted/40 p-1.5">
                          <span className="text-muted-foreground">Location: </span>
                          <strong>
                            {msg.extractedFacts.district ? `${msg.extractedFacts.district}, ` : ''}
                            {msg.extractedFacts.state}
                          </strong>
                        </div>
                      )}
                      {msg.extractedFacts.familyAnnualIncomeInr && (
                        <div className="rounded bg-muted/40 p-1.5">
                          <span className="text-muted-foreground">Family Income: </span>
                          <strong>₹{msg.extractedFacts.familyAnnualIncomeInr.toLocaleString('en-IN')} / year</strong>
                        </div>
                      )}
                      {msg.extractedFacts.employmentStatus && (
                        <div className="rounded bg-muted/40 p-1.5">
                          <span className="text-muted-foreground">Employment: </span>
                          <strong className="capitalize">
                            {msg.extractedFacts.employmentStatus.replace('_', ' ')}
                          </strong>
                        </div>
                      )}
                      {msg.extractedFacts.class12Percentage && (
                        <div className="rounded bg-muted/40 p-1.5">
                          <span className="text-muted-foreground">Class 12 Marks: </span>
                          <strong>{msg.extractedFacts.class12Percentage}%</strong>
                        </div>
                      )}
                    </div>

                    {msg.confirmed ? (
                      <div className="flex items-center justify-between border-t border-border pt-2 text-emerald-600 font-medium text-xs">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Saved to {activeCitizen.name}&apos;s profile!
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end border-t border-border pt-2">
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleConfirm(msg.id, msg.extractedFacts!)}
                          className="h-7 text-xs font-mono font-bold"
                        >
                          Confirm &amp; Save Details
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Follow-up question chips */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    {msg.suggestedFollowUps.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={isPending}
                        onClick={() => handleSend(q)}
                        className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-foreground/60 transition-colors cursor-pointer text-left"
                      >
                        {q} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isPending && (
          <div className="flex gap-3 justify-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] bg-foreground text-background animate-pulse">
              <PraptiLogo className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-lg bg-muted/40 border border-border/80 p-3 text-xs text-muted-foreground flex items-center gap-2 font-mono">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Analyzing rules &amp; facts for {activeCitizen.name}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips Bar */}
      <div className="border-t border-border bg-muted/20 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
        <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground shrink-0 flex items-center gap-1">
          <HelpCircle className="h-3 w-3" /> Quick Ask:
        </span>
        {starterChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isPending}
            onClick={() => handleSend(chip)}
            className="shrink-0 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-3 bg-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isPending}
            placeholder={`Ask about schemes, why you're not eligible, required documents for ${activeCitizen.name}...`}
            className="flex-1 rounded-[3px] border border-border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isPending || !input.trim()}
            className="h-auto px-4 font-mono font-bold text-xs rounded-[3px]"
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

/**
 * Generates tailored prompt chips based on the active member's category tags.
 */
function getDynamicStarterPrompts(activeCitizen: { name: string; relationship: string; categoryTags?: string[] }): string[] {
  const tags = (activeCitizen.categoryTags ?? []).map((t) => t.toLowerCase());

  const chips: string[] = ['What schemes am I eligible for?'];

  if (tags.includes('student') || tags.includes('scholarship')) {
    chips.push('Am I eligible for Swami Vivekananda Scholarship?');
    chips.push('What scholarship documents am I missing?');
  } else if (tags.includes('elderly') || tags.includes('elder') || tags.includes('retired') || tags.some((t) => t.includes('60'))) {
    chips.push('What old age pensions or Annapurna food schemes can I get?');
    chips.push('Why am I not eligible for some pension schemes?');
  } else if (tags.includes('women') || tags.includes('girl') || tags.includes('widow')) {
    chips.push('What women empowerment schemes can I apply for?');
    chips.push('Why am I not eligible for Majhi Ladki Bahin?');
  } else if (tags.includes('farmer') || tags.includes('agriculture')) {
    chips.push('Am I eligible for PM-KISAN or Krishak Bandhu?');
    chips.push('What land documents do I need?');
  } else {
    chips.push('What documents am I missing?');
    chips.push('Why am I not eligible for some schemes?');
  }

  return chips.slice(0, 4);
}
