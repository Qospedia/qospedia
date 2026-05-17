export const metadata = { title: 'Terms of Service - Qospedia' };

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: May 2026</p>
        <section className="mt-8"><h2 className="font-serif text-2xl font-bold text-foreground mb-4">1. Acceptance</h2><p className="text-muted-foreground">By using Qospedia, you accept these terms. If not, please do not use the platform.</p></section>
        <section className="mt-8"><h2 className="font-serif text-2xl font-bold text-foreground mb-4">2. Use License</h2><ul className="list-disc list-inside space-y-2 text-muted-foreground"><li>View and read content for personal use</li><li>Create account to contribute (subject to approval)</li><li>AI tools available for approved editors</li></ul></section>
        <section className="mt-8"><h2 className="font-serif text-2xl font-bold text-foreground mb-4">3. Contact</h2><p className="text-muted-foreground">Questions? Email: <strong>qospedia.com@gmail.com</strong></p></section>
      </div>
    </div>
  );
}