"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppFooter() {
  const pathname = usePathname();
  
  // Hide footer on certain pages
  const hideFooter = pathname === '/' || pathname?.startsWith('/login') || pathname?.startsWith('/signup') || pathname?.startsWith('/verify');
  
  if (hideFooter) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Features', href: '/#features' },
      { name: 'Pricing', href: '/#pricing' },
      { name: 'FAQ', href: '/#faq' },
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' },
    ],
    legal: [
      { name: 'Privacy', href: '/privacy' },
      { name: 'Terms', href: '/terms' },
      { name: 'Security', href: '/security' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Contact', href: '/contact' },
      { name: 'Status', href: '/status' },
    ],
  };

  return (
    <footer className="mt-auto border-t" style={{ backgroundColor: '#FDFCFA', borderColor: '#E8E6DD' }}>
      <div className="max-w-[1440px] mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/home" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1C4D3A' }}>
                <span className="text-white font-display font-bold text-lg">P</span>
              </div>
              <span className="font-display font-semibold text-xl" style={{ color: '#2D3330' }}>
                Proofound
              </span>
            </Link>
            <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
              Credibility engineering for impactful connections.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#2D3330' }}>
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:underline transition-colors"
                    style={{ color: '#6B6760' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#2D3330' }}>
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:underline transition-colors"
                    style={{ color: '#6B6760' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#2D3330' }}>
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:underline transition-colors"
                    style={{ color: '#6B6760' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#2D3330' }}>
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:underline transition-colors"
                    style={{ color: '#6B6760' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderColor: '#E8E6DD' }}>
          <p className="text-sm" style={{ color: '#6B6760' }}>
            © {currentYear} Proofound. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="https://twitter.com/proofound" target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: '#6B6760' }}>
              Twitter
            </Link>
            <Link href="https://linkedin.com/company/proofound" target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: '#6B6760' }}>
              LinkedIn
            </Link>
            <Link href="https://github.com/proofound" target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: '#6B6760' }}>
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

