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
    <footer className="border-t border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#FCFCFC] dark:bg-[#050505]">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="text-[20px] font-semibold text-[#050505] dark:text-[#FCFCFC] tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Qospedia</Link>
            <p className="mt-4 text-[14px] text-[#636363] dark:text-[#858585]">A modern encyclopedia with AI-powered features.</p>
            <div className="mt-4 text-[14px] text-[#636363] dark:text-[#858585]">
              <p><span className="font-medium text-[#050505] dark:text-[#FCFCFC]">Founder:</span> Shaurya Agarwal</p>
              <p><span className="font-medium text-[#050505] dark:text-[#FCFCFC]">Parent:</span> HALONAI</p>
            </div>
          </div>
          <div>
            <h4 className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC] mb-4">Platform</h4>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-[14px] text-[#636363] dark:text-[#858585] hover:text-[#050505] dark:hover:text-[#FCFCFC]">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC] mb-4">Community</h4>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-[14px] text-[#636363] dark:text-[#858585] hover:text-[#050505] dark:hover:text-[#FCFCFC]">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC] mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-[14px] text-[#636363] dark:text-[#858585] hover:text-[#050505] dark:hover:text-[#FCFCFC]">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] flex items-center justify-between">
          <p className="text-[12px] text-[#858585] dark:text-[#636363]">© {new Date().getFullYear()} Qospedia. A HALONAI Company.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-[12px] text-[#858585] dark:text-[#636363] hover:text-[#050505] dark:hover:text-[#FCFCFC]">Terms of Service</Link>
            <Link href="/privacy" className="text-[12px] text-[#858585] dark:text-[#636363] hover:text-[#050505] dark:hover:text-[#FCFCFC]">Privacy Policy</Link>
            <Link href="/about" className="text-[12px] text-[#858585] dark:text-[#636363] hover:text-[#050505] dark:hover:text-[#FCFCFC]">About</Link>
            <Link href="/contact" className="text-[12px] text-[#858585] dark:text-[#636363] hover:text-[#050505] dark:hover:text-[#FCFCFC]">Feedback</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}