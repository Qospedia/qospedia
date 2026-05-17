export const metadata = { title: 'Guidelines - Qospedia' };

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Community Guidelines</h1>
        <section className="mt-8"><h2 className="font-serif text-2xl font-bold text-foreground mb-4">Content Standards</h2><ul className="list-disc list-inside space-y-2 text-muted-foreground"><li><strong>Accuracy:</strong> All content should be factually correct</li><li><strong>Neutrality:</strong> Maintain a neutral, encyclopedic tone</li><li><strong>Citations:</strong> Include reliable sources</li></ul></section>
        <section className="mt-8"><h2 className="font-serif text-2xl font-bold text-foreground mb-4">AI-Assisted Content</h2><p className="text-muted-foreground">All AI-generated content must be reviewed and approved by human editors before publication.</p></section>
      </div>
    </div>
  );
}