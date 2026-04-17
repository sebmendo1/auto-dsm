'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { TopBar } from '@/components/shell/TopBar';

interface Message { role: 'user' | 'assistant'; text: string }

const HARDCODED = `Thanks for asking. Full Gemini integration is coming soon — once it's live I'll be able to answer this grounded in your actual repo. For now, here's a placeholder: this agent will help you understand your design system's structure, explain how components are used, and suggest improvements.`;

export default function AgentPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  function submit() {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { role: 'assistant', text: HARDCODED }]);
    }, 1200);
  }

  const active = messages.length > 0 || typing;

  return (
    <>
      <TopBar />
      <div className="flex-1 flex flex-col min-h-0">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <h1 className="font-display font-bold text-[28px] text-t-primary">
              Let&apos;s design autoDSM
            </h1>
            <div className="mt-8 w-full max-w-[680px]">
              <Composer value={input} onChange={setInput} onSubmit={submit} />
            </div>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
              <ul className="max-w-[760px] mx-auto flex flex-col gap-4">
                {messages.map((m, i) => (
                  <li key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className={
                        m.role === 'user'
                          ? 'max-w-[70%] rounded-2xl px-4 py-3 text-[14px] text-t-primary'
                          : 'max-w-[70%] text-[14px] text-t-primary'
                      }
                      style={m.role === 'user' ? { background: 'var(--bg-tertiary)' } : {}}
                    >
                      {m.text}
                    </div>
                  </li>
                ))}
                {typing && (
                  <li className="flex justify-start">
                    <div className="flex gap-1 items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)] animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)] animate-bounce [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)] animate-bounce [animation-delay:240ms]" />
                    </div>
                  </li>
                )}
              </ul>
            </div>
            <div className="border-t border-t-default px-6 py-6">
              <div className="max-w-[760px] mx-auto">
                <Composer value={input} onChange={setInput} onSubmit={submit} />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div
      className="relative rounded-2xl border border-t-default p-5"
      style={{ background: 'var(--bg-elevated)', minHeight: 120 }}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        rows={3}
        placeholder="Ask any questions about your design system or brand"
        className="w-full bg-transparent border-0 outline-none resize-none text-[15px] text-t-primary placeholder:text-t-placeholder"
      />
      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        aria-label="Send message"
        className="absolute right-4 bottom-4 h-10 w-10 rounded-full flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-base"
      >
        <ArrowUp size={20} strokeWidth={1.5} className="text-white" />
      </button>
    </div>
  );
}
