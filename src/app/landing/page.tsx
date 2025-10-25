import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { User, Building2, Shield, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { NetworkBackground } from '@/components/landing/NetworkBackground';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base relative">
      {/* Living Network Background - subtle */}
      <NetworkBackground />

      {/* Hero Section */}
      <section className="container mx-auto px-4 section-pad relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-display font-semibold text-brand-sage mb-6">
            Proofound
          </h1>
          <p className="text-xl md:text-2xl text-fg-base opacity-80 mb-4">
            Credibility you can trust. Connections that matter.
          </p>
          <p className="text-lg text-fg-base opacity-60 mb-8 max-w-2xl mx-auto">
            A platform that puts proof first—where credentials are verified, achievements are
            authentic, and professional relationships are built on trust.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For Individuals & Organizations */}
      <section className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="border-2 hover:border-brand-sage transition-all hover:shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-brand-sage bg-opacity-10 flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-brand-sage" />
              </div>
              <CardTitle className="text-2xl">For Individuals</CardTitle>
              <CardDescription className="text-base mt-2">
                Build a credible professional profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-sage mt-0.5 flex-shrink-0" />
                  <span className="text-fg-base opacity-80">
                    Showcase verified skills and achievements
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-sage mt-0.5 flex-shrink-0" />
                  <span className="text-fg-base opacity-80">
                    Connect with opportunities based on proof
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-sage mt-0.5 flex-shrink-0" />
                  <span className="text-fg-base opacity-80">Control your data and privacy</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-sage mt-0.5 flex-shrink-0" />
                  <span className="text-fg-base opacity-80">
                    Build authentic professional relationships
                  </span>
                </li>
              </ul>
              <Button asChild className="w-full mt-6">
                <Link href="/signup">
                  Create Individual Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-brand-terracotta transition-all hover:shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-brand-terracotta bg-opacity-10 flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-brand-terracotta" />
              </div>
              <CardTitle className="text-2xl">For Organizations</CardTitle>
              <CardDescription className="text-base mt-2">
                Build trust and manage your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-terracotta mt-0.5 flex-shrink-0" />
                  <span className="text-fg-base opacity-80">
                    Establish organizational credibility
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-terracotta mt-0.5 flex-shrink-0" />
                  <span className="text-fg-base opacity-80">
                    Manage team members and permissions
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-terracotta mt-0.5 flex-shrink-0" />
                  <span className="text-fg-base opacity-80">
                    Track organizational activity and audit logs
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-terracotta mt-0.5 flex-shrink-0" />
                  <span className="text-fg-base opacity-80">
                    Collaborate with verified professionals
                  </span>
                </li>
              </ul>
              <Button asChild className="w-full mt-6">
                <Link href="/signup">
                  Create Organization
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Principles Section */}
      <section className="bg-muted py-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-brand-sage mb-4">
              Built on Trust
            </h2>
            <p className="text-lg text-fg-base opacity-80">
              Our platform is guided by principles that put people first
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-brand-sage bg-opacity-20 flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-brand-sage" />
              </div>
              <h3 className="text-xl font-semibold text-brand-sage mb-2">Privacy First</h3>
              <p className="text-fg-base opacity-80">
                You control your data. No tracking, no selling your information, no hidden agendas.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-brand-sage bg-opacity-20 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-brand-sage" />
              </div>
              <h3 className="text-xl font-semibold text-brand-sage mb-2">Community Owned</h3>
              <p className="text-fg-base opacity-80">
                Built for steward ownership—the community guides the platform&apos;s future.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-brand-sage bg-opacity-20 flex items-center justify-center mb-4">
                <CheckCircle className="w-7 h-7 text-brand-sage" />
              </div>
              <h3 className="text-xl font-semibold text-brand-sage mb-2">Bias-Free</h3>
              <p className="text-fg-base opacity-80">
                Proof-based profiles reduce bias and focus on what truly matters: your work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-brand-sage mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">What is Proofound?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-fg-base opacity-80">
                  Proofound is a credibility and connection platform that helps individuals and
                  organizations build trust through verified achievements and transparent profiles.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">How do I get started?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-fg-base opacity-80">
                  Sign up with your email, verify your account, and choose whether you want to
                  create an individual profile or an organization. Our onboarding guide will walk
                  you through the rest.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Is Proofound free?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-fg-base opacity-80">
                  Yes! Proofound is currently free during our early access phase. We&apos;re
                  building the platform with the community and will always offer a generous free
                  tier.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">How is my data protected?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-fg-base opacity-80">
                  We use industry-standard encryption and security practices. Your data is stored
                  securely, never sold to third parties, and you have full control over what you
                  share.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-sage text-white py-16 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-semibold mb-4">
            Ready to build your credibility?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join early adopters who are creating a more trustworthy professional world.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link href="/signup">
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-fg-base text-white py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">Proofound</h3>
              <p className="text-sm opacity-80">
                Building trust through verified credentials and authentic connections.
              </p>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/signup" className="opacity-80 hover:opacity-100 transition-opacity">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="opacity-80 hover:opacity-100 transition-opacity">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="mailto:hello@proofound.io"
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white border-opacity-20 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Proofound. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
