'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './header';

export function NavbarWrapper() {
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  if (isHomepage) {
    return null;
  }

  return <Navbar />;
}