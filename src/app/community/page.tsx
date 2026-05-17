import Link from 'next/link';
export const metadata = { title: 'Community - Qospedia' };

export default function CommunityPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Community</h1>
        <p className="text-xl text-muted-foreground mb-8">Welcome to the Qospedia community!</p>
        <section className="mt-8"><h2 className="font-serif text-2xl font-bold text-foreground mb-4">Ways to Contribute</h2><ul className="list-disc list-inside space-y-2 text-muted-foreground"><li>Write Articles</li><li>Edit & Improve</li><li>AI Collaboration</li><li>Feedback</li></ul></section>
        <section className="mt-8"><p className="text-muted-foreground">See our <Link href="/guidelines" className="text-accent hover:underline">Guidelines</Link> and <Link href="/help" className="text-accent hover:underline">Help Center</Link></p></section>
      </div>
    </div>
  );
}