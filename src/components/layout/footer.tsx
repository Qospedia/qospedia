import Link from 'next/link';

const footerLinks = {
  platform: [
    { href: '/', label: 'Home' },
    { href: '/categories', label: 'Categories' },
    { href: '/recent', label: 'Recent' },
    { href: '/search', label: 'Search' },
  ],
  community: [
    { href: '/community', label: 'Community' },
    { href: '/about', label: 'About' },
    { href: '/guidelines', label: 'Guidelines' },
    { href: '/help', label: 'Help' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/contact', label: 'Contact' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="font-serif text-2xl font-bold text-primary">Qospedia</Link>
            <p className="mt-4 text-sm text-muted-foreground">A modern encyclopedia with AI-powered features.</p>
            <div className="mt-4 text-sm text-muted-foreground">
              <p><span className="font-medium">Founder:</span> Shaurya Agarwal</p>
              <p><span className="font-medium">Parent:</span> HALONAI</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-4">Platform</h4>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-4">Community</h4>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">© {new Date().getFullYear()} Qospedia. A HALONAI Company.</p>
        </div>
      </div>
    </footer>
  );
}