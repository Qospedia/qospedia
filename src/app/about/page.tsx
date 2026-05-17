export const metadata = { title: 'About - Qospedia' };

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">About Qospedia</h1>
        <p className="text-xl text-muted-foreground mb-8">A modern, AI-powered knowledge platform designed to make learning accessible, engaging, and comprehensive.</p>
        <section className="mt-8"><h2 className="font-serif text-2xl font-bold text-foreground mb-4">Our Mission</h2><p className="text-muted-foreground">To create a collaborative platform where AI and human expertise come together to build the most comprehensive knowledge base possible.</p></section>
        <section className="mt-8"><h2 className="font-serif text-2xl font-bold text-foreground mb-4">Founded By</h2><div className="bg-card border border-border rounded-lg p-6"><p className="text-lg font-semibold text-foreground">Shaurya Agarwal</p><p className="text-muted-foreground mt-2">Founder & Visionary</p></div></section>
        <section className="mt-8"><h2 className="font-serif text-2xl font-bold text-foreground mb-4">Parent Company</h2><div className="bg-card border border-border rounded-lg p-6"><p className="text-xl font-semibold text-foreground">HALONAI</p><p className="text-muted-foreground mt-2">A technology company pioneering AI-powered solutions for education.</p></div></section>
      </div>
    </div>
  );
}