'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Mic, X, TrendingUp, Clock } from 'lucide-react';
import { Input } from './input';
import { cn } from '@/lib/utils';

const TRENDING_TOPICS = [
  'Quantum Computing',
  'CRISPR Gene Editing',
  'SpaceX Starship',
  'AI Ethics',
  'Climate Change',
  'Blockchain',
];

interface SearchBarProps {
  className?: string;
  inputClassName?: string;
  showVoice?: boolean;
  autoFocus?: boolean;
}

export function SearchBar({ 
  className, 
  inputClassName,
  showVoice = false,
  autoFocus = false
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    
    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 4);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleVoiceClick = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition not supported in your browser');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const removeRecentSearch = (search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== search);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleTrendingClick = (topic: string) => {
    handleSearch(topic);
  };

  return (
    <div className={cn('relative', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#858585] dark:text-[#636363] z-10 pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          autoFocus={autoFocus}
          className={cn(
            'pl-9 pr-24 bg-[#F7F7F7] dark:bg-[#1A1A1A] border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] placeholder:text-[#858585] dark:placeholder:text-[#636363] text-[#050505] dark:text-[#FCFCFC]',
            inputClassName
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1.5 hover:bg-[rgba(5,5,5,0.1)] dark:hover:bg-[rgba(252,252,252,0.1)] rounded-md transition-colors"
            >
              <X className="h-4 w-4 text-[#858585] dark:text-[#636363]" />
            </button>
          )}
          {showVoice && (
            <button
              type="button"
              onClick={handleVoiceClick}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                isListening 
                  ? 'bg-[#EF4444] text-white' 
                  : 'hover:bg-[rgba(5,5,5,0.1)] dark:hover:bg-[rgba(252,252,252,0.1)] text-[#858585] dark:text-[#636363]'
              )}
            >
              <Mic className={cn('h-4 w-4', isListening && 'animate-pulse')} />
            </button>
          )}
          <button
            type="submit"
            className="p-1.5 bg-[#050505] dark:bg-[#FCFCFC] rounded-md hover:bg-[#1a1a1a] dark:hover:bg-[#E5E7EB] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#FCFCFC] dark:text-[#050505] rotate-45 -mt-0.5">
              <line x1="12" x2="12" y1="19" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </button>
        </div>
      </form>

      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#FCFCFC] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] rounded-lg shadow-lg z-50 overflow-hidden">
          {recentSearches.length > 0 && (
            <div className="p-3 border-b border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
              <div className="flex items-center gap-2 text-[12px] font-medium text-[#636363] dark:text-[#858585] mb-2">
                <Clock className="h-3.5 w-3.5" />
                Recent Searches
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(search)}
                    className="flex items-center justify-between w-full px-2 py-1.5 text-[14px] text-[#050505] dark:text-[#FCFCFC] hover:bg-[#F7F7F7] dark:hover:bg-[#1A1A1A] rounded-md group"
                  >
                    <span>{search}</span>
                    <X 
                      className="h-3.5 w-3.5 text-[#858585] dark:text-[#636363] opacity-0 group-hover:opacity-100 transition-opacity" 
                      onClick={(e) => removeRecentSearch(search, e)}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="p-3">
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#636363] dark:text-[#858585] mb-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Trending Topics
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_TOPICS.slice(0, 4).map((topic, i) => (
                <button
                  key={i}
                  onClick={() => handleTrendingClick(topic)}
                  className="px-3 py-1.5 text-[13px] bg-[#F7F7F7] dark:bg-[#1A1A1A] text-[#050505] dark:text-[#FCFCFC] rounded-full hover:bg-[#E5E7EB] dark:hover:bg-[#2A2A2A] transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}