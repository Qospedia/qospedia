import Link from 'next/link';
export const metadata = { title: 'Help - Qospedia' };

export default function HelpPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Help Center</h1>
        <section className="mt-8"><h2 className="font-serif text-2xl font-bold text-foreground mb-4">Getting Started</h2><div className="space-y-4"><div className="bg-card border border-border rounded-lg p-6"><h3 className="font-semibold text-foreground mb-2">How do I create an account?</h3><p className="text-muted-foreground">Click "Sign Up" and sign up with email or Google.</p></div><div className="bg-card border border-border rounded-lg p-6"><h3 className="font-semibold text-foreground mb-2">How do I become an editor?</h3><p className="text-muted-foreground">Contact us to request editor access.</p></div></div></section>
        <section className="mt-8"><p className="text-muted-foreground">Can't find what you need? <Link href="/contact" className="text-accent hover:underline">Contact Support</Link></p></section>
      </div>
    </div>
  );
}