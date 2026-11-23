'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
  Bot,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  processAssistantMessage,
  confirmAndSaveFacts,
} from './actions';
import type { ExtractedFacts } from '@/services/gemini';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  extractedFacts?: ExtractedFacts | null;
  confirmed?: boolean;
}

const STARTER_PROMPTS = [
  'I am a 19-year-old unmarried female student from Nadia in 1st year college, family income ₹1.2 lakh.',
  'আমি নদীয়ার বাসিন্দা, ১৮ বছর বয়সী অবিবাহিত ছাত্রী, পরিবারিক আয় বছরে ১ লাখ টাকা।',
  'I am a 32-year-old woman residing in West Bengal.',
  'I am a farmer from Burdwan, West Bengal cultivating 2 acres of agricultural land.',
];

export function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your PRAPTI benefits companion. You can describe your life circumstances in plain English or Bengali — your age, education, location, work, or family income. I will understand your situation, help you review what was captured, and match you with verified government schemes.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPending]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isPending) return;

    const userMsgId = Date.now().toString();
    setMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text }]);
    setInput('');

    startTransition(async () => {
      const res = await processAssistantMessage(text);
      if (res.ok) {
        const assistantMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            sender: 'assistant',
            text: res.facts.assistantReply,
            extractedFacts: res.facts,
            confirmed: false,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: 'I could not process that message right now. Please try again or update your details in the profile tabs directly.',
          },
        ]);
      }
    });
  };

  const handleConfirm = (msgId: string, facts: ExtractedFacts) => {
    startTransition(async () => {
      const res = await confirmAndSaveFacts(facts);
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, confirmed: true } : m)),
        );
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] min-h-[500px] rounded-lg border border-border bg-card">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] space-y-3 rounded-lg p-3 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/40 text-foreground border border-border/60'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Structured Extracted Facts Confirmation Card */}
              {msg.extractedFacts && (
                <div className="mt-3 rounded-md border border-border bg-background p-3 text-xs text-foreground space-y-2.5">
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Extracted Facts (Pending Your Confirmation)</span>
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
                        <span className="text-muted-foreground">Status: </span>
                        <strong className="capitalize">
                          {msg.extractedFacts.employmentStatus.replace('_', ' ')}
                        </strong>
                      </div>
                    )}
                    {msg.extractedFacts.class12Percentage && (
                      <div className="rounded bg-muted/40 p-1.5">
                        <span className="text-muted-foreground">Class 12 Score: </span>
                        <strong>{msg.extractedFacts.class12Percentage}%</strong>
                      </div>
                    )}
                  </div>

                  {msg.confirmed ? (
                    <div className="flex items-center justify-between border-t border-border pt-2 text-emerald-600 font-medium text-xs">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Saved to your profile!
                      </span>
                      <Link
                        href="/opportunities"
                        className="inline-flex items-center gap-1 underline text-primary"
                      >
                        Check matches <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ) : (
                    <div className="border-t border-border pt-2">
                      <p className="text-[11px] text-muted-foreground mb-2">
                        Per PRAPTI safety rules, facts are never saved without your confirmation.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(msg.id, msg.extractedFacts!)}
                        disabled={isPending}
                        className="w-full sm:w-auto text-xs"
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Confirm & Save to Profile
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {isPending && (
          <div className="flex gap-3 items-center text-xs text-muted-foreground">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="h-4 w-4 animate-spin" />
            </div>
            <span>Analyzing circumstances against government scheme criteria...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts */}
      {messages.length <= 2 && (
        <div className="border-t border-border/80 p-3 bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground mb-2">Try an example description:</p>
          <div className="flex flex-wrap gap-1.5">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground text-left transition-colors"
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isPending}
            placeholder="Type your message in English or Bengali (e.g., age, education, location, work)..."
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          />
          <Button type="submit" size="sm" disabled={isPending || !input.trim()}>
            <Send className="h-3.5 w-3.5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

