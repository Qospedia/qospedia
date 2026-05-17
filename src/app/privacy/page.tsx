export const metadata = { title: 'Privacy Policy - Qospedia' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: May 2026</p>
        <section className="mt-8"><h2 className="font-serif text-2xl font-bold text-foreground mb-4">1. Introduction</h2><p className="text-muted-foreground">We take your privacy seriously. This policy explains how we collect, use, and protect your information.</p></section>
        <section className="mt-8"><h2 className="font-serif text-2xl font-bold text-foreground mb-4">2. Information We Collect</h2><ul className="list-disc list-inside space-y-2 text-muted-foreground"><li>Account information (name, email)</li><li>Content you create</li><li>Authentication data from Google OAuth</li></ul></section>
        <section className="mt-8"><h2 className="font-serif text-2xl font-bold text-foreground mb-4">3. Contact</h2><p className="text-muted-foreground">Questions? Email: <strong>qospedia.com@gmail.com</strong></p></section>
      </div>
    </div>
  );
}