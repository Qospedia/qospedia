'use client';

import { useState } from 'react';
import { Volume2, Link2, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ArticleActionsProps {
  title: string;
  className?: string;
}

export function ArticleActions({ title, className }: ArticleActionsProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleSpeak = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(title);
      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: window.location.href,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Failed to share');
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSpeak}
        className="text-[#636363] dark:text-[#858585] hover:bg-[rgba(5,5,5,0.05)] dark:hover:bg-[rgba(252,252,252,0.1)]"
        title="Speak aloud"
      >
        <Volume2 className={cn('h-4 w-4', isSpeaking && 'text-[#2563EB]')} />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyLink}
        className="text-[#636363] dark:text-[#858585] hover:bg-[rgba(5,5,5,0.05)] dark:hover:bg-[rgba(252,252,252,0.1)]"
        title="Copy link"
      >
        {copied ? <Check className="h-4 w-4 text-[#22C55E]" /> : <Link2 className="h-4 w-4" />}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="text-[#636363] dark:text-[#858585] hover:bg-[rgba(5,5,5,0.05)] dark:hover:bg-[rgba(252,252,252,0.1)]"
        title="Share article"
      >
        {shared ? <Check className="h-4 w-4 text-[#22C55E]" /> : <Share2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}