/**
 * Accessibility Statement
 *
 * Public-facing statement of Proofound's commitment to accessibility
 * and WCAG 2.1 AA compliance
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Accessibility Statement - Proofound',
  description:
    'Learn about our commitment to accessibility and how we ensure our platform is usable by everyone.',
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            WCAG 2.1 AA
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Accessibility Statement</h1>
          <p className="text-xl text-gray-600">
            Proofound is committed to ensuring digital accessibility for people with disabilities.
          </p>
        </div>

        <div className="space-y-6">
          {/* Commitment */}
          <Card>
            <CardHeader>
              <CardTitle>Our Commitment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We believe that everyone should have equal access to opportunities and connections,
                regardless of their abilities. We are continually improving the user experience for
                everyone and applying the relevant accessibility standards.
              </p>
              <p className="text-gray-700">
                Proofound strives to conform to the Web Content Accessibility Guidelines (WCAG) 2.1
                at the AA level. These guidelines help us make web content more accessible for
                people with disabilities and user-friendly for everyone.
              </p>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  'Keyboard navigation support for all interactive elements',
                  'Screen reader compatibility (tested with NVDA and VoiceOver)',
                  'Text alternatives for images and icons',
                  'Sufficient color contrast ratios (minimum 4.5:1)',
                  'Resizable text without loss of functionality',
                  'Semantic HTML structure and ARIA labels',
                  'Focus indicators for keyboard users',
                  'Skip-to-content link for easier navigation',
                  'Clear and consistent page structure',
                  'Form labels and error messages',
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Conformance Status */}
          <Card>
            <CardHeader>
              <CardTitle>Conformance Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge className="mb-2">Partially Conformant</Badge>
                <p className="text-gray-700">
                  The Web Content Accessibility Guidelines (WCAG) defines requirements for designers
                  and developers to improve accessibility for people with disabilities. It defines
                  three levels of conformance: Level A, Level AA, and Level AAA.
                </p>
              </div>
              <p className="text-gray-700">
                Proofound is <strong>partially conformant</strong> with WCAG 2.1 Level AA. Partially
                conformant means that some parts of the content do not fully conform to the
                accessibility standard. We are actively working to address any non-conformant areas.
              </p>
            </CardContent>
          </Card>

          {/* Known Issues */}
          <Card>
            <CardHeader>
              <CardTitle>Known Limitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Despite our best efforts to ensure accessibility, there may be some limitations.
                Below is a description of known limitations and potential solutions:
              </p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>Some complex interactive components may have limited keyboard shortcuts</li>
                <li>
                  Dynamic content updates may not always announce to screen readers immediately
                </li>
                <li>Third-party embedded content may not be fully accessible</li>
              </ul>
              <p className="text-gray-700">
                We are continuously working to improve these areas and appreciate your patience as
                we work toward full conformance.
              </p>
            </CardContent>
          </Card>

          {/* Assistive Technologies */}
          <Card>
            <CardHeader>
              <CardTitle>Compatible Technologies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Proofound is designed to be compatible with the following assistive technologies:
              </p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>Screen readers (NVDA, JAWS, VoiceOver)</li>
                <li>Keyboard-only navigation</li>
                <li>Browser zoom and text resizing</li>
                <li>Speech recognition software</li>
                <li>Screen magnification tools</li>
              </ul>
              <p className="text-gray-700 mt-4">
                <strong>Supported Browsers:</strong>
              </p>
              <ul className="space-y-1 text-gray-700 list-disc list-inside">
                <li>Chrome (latest version)</li>
                <li>Firefox (latest version)</li>
                <li>Safari (latest version)</li>
                <li>Edge (latest version)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-700">
              <p>
                <strong>Accessibility Standard:</strong> WCAG 2.1 Level AA
              </p>
              <p>
                <strong>Technologies Used:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>HTML5</li>
                <li>CSS3</li>
                <li>JavaScript (React/Next.js)</li>
                <li>WAI-ARIA</li>
              </ul>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback and Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We welcome your feedback on the accessibility of Proofound. Please let us know if
                you encounter accessibility barriers:
              </p>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <a
                    href="mailto:accessibility@proofound.app"
                    className="text-blue-600 hover:underline"
                  >
                    accessibility@proofound.app
                  </a>
                </div>
              </div>
              <p className="text-gray-700">
                We aim to respond to accessibility feedback within 5 business days and to propose a
                solution within 10 business days.
              </p>
            </CardContent>
          </Card>

          {/* Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Approach</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Proofound assessed the accessibility of this website by the following approaches:
              </p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>Self-evaluation using automated accessibility testing tools</li>
                <li>Manual testing with keyboard-only navigation</li>
                <li>Screen reader testing (NVDA and VoiceOver)</li>
                <li>Color contrast verification</li>
                <li>Code review for semantic HTML and ARIA compliance</li>
              </ul>
            </CardContent>
          </Card>

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-600">
            <p>This statement was last updated on November 5, 2025.</p>
            <p className="mt-2">
              We are committed to regular accessibility reviews and will update this statement as we
              make improvements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
