'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BookOpen, Edit3, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

type SuggestionType = 'new_article' | 'edit';

export default function SuggestPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [suggestionType, setSuggestionType] = useState<SuggestionType>('new_article');
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [summary, setSummary] = useState('');
  const [sources, setSources] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const addSource = () => {
    setSources([...sources, '']);
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const updateSource = (index: number, value: string) => {
    const newSources = [...sources];
    newSources[index] = value;
    setSources(newSources);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      
      const validSources = sources.filter(s => s.trim() !== '');
      
      const { error: submitError } = await supabase.from('article_suggestions').insert({
        type: suggestionType,
        topic: topic.trim(),
        details: details.trim(),
        summary: summary.trim(),
        sources: validSources,
        user_id: user?.id || null,
        status: 'pending'
      });

      if (submitError) throw submitError;
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit suggestion');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen py-12 px-4 bg-[#FCFCFC] dark:bg-[#050505]">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-[#DCFCE7] dark:bg-[rgba(34,197,94,0.2)] flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-[#22C55E]" />
              </div>
            </div>
            <h1 className="text-[28px] font-semibold text-[#050505] dark:text-[#FCFCFC]">Thank You!</h1>
            <p className="text-[16px] text-[#636363] dark:text-[#858585] max-w-md mx-auto">
              {suggestionType === 'new_article' 
                ? 'Your article suggestion has been submitted. Our editors will review it and may reach out for more details.'
                : 'Your edit suggestion has been submitted. Our editors will review it and implement the changes if approved.'}
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/">
                <Button className="bg-[#050505] dark:bg-[#FCFCFC] text-[#FCFCFC] dark:text-[#050505] hover:bg-[#1a1a1a] dark:hover:bg-[#E5E7EB]">
                  Back to Home
                </Button>
              </Link>
              <Button 
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setTopic('');
                  setDetails('');
                  setSummary('');
                  setSources(['', '']);
                }}
                className="border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] text-[#050505] dark:text-[#FCFCFC]"
              >
                Submit Another
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-[#FCFCFC] dark:bg-[#050505]">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-semibold text-[#050505] dark:text-[#FCFCFC] mb-3">Suggest an Article</h1>
          <p className="text-[16px] text-[#636363] dark:text-[#858585]">
            Help us expand our knowledge base
          </p>
        </div>

        <div className="flex gap-2 mb-8 p-1 bg-[#F7F7F7] dark:bg-[#1A1A1A] rounded-lg">
          <button
            onClick={() => setSuggestionType('new_article')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-[14px] font-medium transition-all ${
              suggestionType === 'new_article'
                ? 'bg-[#FCFCFC] dark:bg-[#050505] text-[#050505] dark:text-[#FCFCFC] shadow-sm'
                : 'text-[#636363] dark:text-[#858585] hover:text-[#050505] dark:hover:text-[#FCFCFC]'
            }`}
          >
            <Plus className="w-4 h-4" />
            New Article
          </button>
          <button
            onClick={() => setSuggestionType('edit')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-[14px] font-medium transition-all ${
              suggestionType === 'edit'
                ? 'bg-[#FCFCFC] dark:bg-[#050505] text-[#050505] dark:text-[#FCFCFC] shadow-sm'
                : 'text-[#636363] dark:text-[#858585] hover:text-[#050505] dark:hover:text-[#FCFCFC]'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Suggest Edit
          </button>
        </div>

        <Card className="border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#FCFCFC] dark:bg-[#0A0A0A]">
          <CardHeader>
            <CardTitle className="text-[18px] font-semibold text-[#050505] dark:text-[#FCFCFC]">
              {suggestionType === 'new_article' ? 'Suggest a New Article' : 'Suggest an Edit'}
            </CardTitle>
            <CardDescription className="text-[#636363] dark:text-[#858585]">
              {suggestionType === 'new_article' 
                ? 'Know something the world should know? Tell us what to write about.'
                : 'Spotted something off? Help us get it right.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.1)] border border-[#EF4444] text-[#EF4444] text-[14px] rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="topic" className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">
                  Topic {suggestionType === 'new_article' ? '(optional if you add details)' : '(optional if you add summary)'}
                </Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={suggestionType === 'new_article' ? "e.g., Quantum error correction, SpaceX Starship" : "e.g., CRISPR gene editing"}
                  className="mt-1.5 bg-[#F7F7F7] dark:bg-[#1A1A1A] border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] text-[#050505] dark:text-[#FCFCFC] placeholder:text-[#858585] dark:placeholder:text-[#636363]"
                />
              </div>

              <div>
                <Label htmlFor="details" className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">
                  {suggestionType === 'new_article' ? 'Details (optional if you add a topic)' : 'Summary'}
                </Label>
                <Textarea
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={
                    suggestionType === 'new_article'
                      ? "Why is this topic interesting? Any key points to cover?"
                      : "What needs fixing? e.g., 'Birth year should be 1990, not 1989'"
                  }
                  rows={4}
                  className="mt-1.5 bg-[#F7F7F7] dark:bg-[#1A1A1A] border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] text-[#050505] dark:text-[#FCFCFC] placeholder:text-[#858585] dark:placeholder:text-[#636363] resize-none"
                />
              </div>

              {suggestionType === 'new_article' && (
                <div className="bg-[#F7F7F7] dark:bg-[#1A1A1A] p-4 rounded-lg">
                  <h3 className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC] mb-3">What makes a great suggestion?</h3>
                  <ul className="space-y-2 text-[14px] text-[#636363] dark:text-[#858585]">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-[#2563EB]" />
                      <span><strong>Specific beats broad</strong> — "CRISPR" over "Biology"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-[#2563EB]" />
                      <span>People, events, and breakthroughs are ideal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-[#2563EB]" />
                      <span>Search first to check if it already exists</span>
                    </li>
                  </ul>
                </div>
              )}

              {suggestionType === 'edit' && (
                <>
                  <div>
                    <Label className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">
                      Supporting sources (optional)
                    </Label>
                    <div className="space-y-2 mt-1.5">
                      {sources.map((source, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={source}
                            onChange={(e) => updateSource(index, e.target.value)}
                            placeholder="https://example.com/source"
                            className="flex-1 bg-[#F7F7F7] dark:bg-[#1A1A1A] border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] text-[#050505] dark:text-[#FCFCFC] placeholder:text-[#858585] dark:placeholder:text-[#636363]"
                          />
                          {sources.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSource(index)}
                              className="text-[#636363] dark:text-[#858585] hover:text-[#EF4444]"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addSource}
                      className="mt-2 text-[14px] text-[#2563EB] hover:underline"
                    >
                      + Add another source
                    </button>
                  </div>

                  <div className="bg-[#F7F7F7] dark:bg-[#1A1A1A] p-4 rounded-lg">
                    <h3 className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC] mb-3">What makes a great edit?</h3>
                    <ul className="space-y-2 text-[14px] text-[#636363] dark:text-[#858585]">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-[#2563EB]" />
                        <span>Select the wrong text in the article first</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-[#2563EB]" />
                        <span>Add a source link so we can verify</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-[#2563EB]" />
                        <span>One fix per submission is easiest to review</span>
                      </li>
                    </ul>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] text-[#050505] dark:text-[#FCFCFC] hover:bg-[#F7F7F7] dark:hover:bg-[#1A1A1A]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || (!topic.trim() && !details.trim())}
                  className="flex-1 bg-[#050505] dark:bg-[#FCFCFC] text-[#FCFCFC] dark:text-[#050505] hover:bg-[#1a1a1a] dark:hover:bg-[#E5E7EB] disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : suggestionType === 'new_article' ? 'Submit Article' : 'Submit Edit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {!user && (
          <p className="text-center text-[14px] text-[#636363] dark:text-[#858585] mt-6">
            <Link href="/auth/login" className="text-[#2563EB] hover:underline">Sign in</Link> to track your suggestions
          </p>
        )}
      </div>
    </div>
  );
}