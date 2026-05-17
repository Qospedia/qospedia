'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Mail, MessageSquare, Send } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, subject, message }) });
      if (res.ok) { toast({ title: 'Message Sent!', description: 'We will get back to you soon.' }); setName(''); setEmail(''); setSubject(''); setMessage(''); }
      else throw new Error('Failed');
    } catch { toast({ title: 'Error', description: 'Email us directly at qospedia.com@gmail.com', variant: 'destructive' }); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Contact & Feedback</h1>
        <p className="text-xl text-muted-foreground mb-8">We'd love to hear from you!</p>
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card><CardContent className="p-6 flex items-start gap-4"><div className="bg-accent/10 p-3 rounded-lg"><Mail className="h-6 w-6 text-accent" /></div><div><h3 className="font-semibold text-foreground">Email Us</h3><p className="text-sm text-muted-foreground mt-1">qospedia.com@gmail.com</p></div></CardContent></Card>
          <Card><CardContent className="p-6 flex items-start gap-4"><div className="bg-accent/10 p-3 rounded-lg"><MessageSquare className="h-6 w-6 text-accent" /></div><div><h3 className="font-semibold text-foreground">Feedback Form</h3><p className="text-sm text-muted-foreground mt-1">Fill out the form below</p></div></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Send us a message</CardTitle><CardDescription>We respond within 24-48 hours.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label htmlFor="name">Your Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" /></div>
                <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" /></div>
              </div>
              <div><Label htmlFor="subject">Subject</Label><Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required className="mt-1" /></div>
              <div><Label htmlFor="message">Message</Label><Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={6} className="mt-1" /></div>
              <Button type="submit" className="w-full" disabled={loading}><Send className="h-4 w-4 mr-2" />{loading ? 'Sending...' : 'Send Message'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}