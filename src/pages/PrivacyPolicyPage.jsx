/* eslint-disable react/no-unescaped-entities */
import { Link } from 'react-router-dom'
import { Shield, Lock, Eye, Users, FileText, Mail, Globe } from '../components/Icons'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      {/* Header */}
      <header className="bg-yellow-300 border-b-4 border-black py-6">
        <div className="max-w-4xl mx-auto px-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 font-bold hover:underline mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-5xl font-extrabold mb-2 flex items-center gap-3">
            <Shield className="w-12 h-12" />
            Privacy Policy
          </h1>
          <p className="text-lg font-semibold">
            Last Updated: October 15, 2025
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white border-4 border-black shadow-[12px_12px_0_#000] rounded-3xl p-8 mb-8">
          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-12">
              <h2 className="text-3xl font-extrabold mb-4 flex items-center gap-2">
                <FileText className="w-8 h-8" />
                Introduction
              </h2>
              <p className="text-lg leading-relaxed mb-4">
                Welcome to SETIQUE ("we," "our," or "us"). We are committed to protecting your privacy and ensuring transparency about how we collect, use, and safeguard your personal information.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                SETIQUE is a niche data marketplace that connects data creators with data consumers. This Privacy Policy explains how we handle your data when you use our platform at <a href="https://setique.com" className="text-blue-600 underline">setique.com</a>.
              </p>
              <p className="text-lg leading-relaxed">
                By using SETIQUE, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-12">
              <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-2 border-t-4 border-black pt-6">
                <Eye className="w-8 h-8" />
                Information We Collect
              </h2>

              <h3 className="text-2xl font-bold mb-3 mt-6">1. Account Information</h3>
              <p className="mb-2">When you create an account, we collect:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li><strong>Email address</strong> (required for authentication)</li>
                <li><strong>Username</strong> (public identifier)</li>
                <li><strong>Password</strong> (encrypted and never stored in plain text)</li>
              </ul>

              <h3 className="text-2xl font-bold mb-3 mt-6">2. Profile Information</h3>
              <p className="mb-2">You may optionally provide:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li><strong>Display name</strong></li>
                <li><strong>Bio/About section</strong></li>
                <li><strong>Avatar/Profile picture</strong></li>
                <li><strong>Location</strong></li>
                <li><strong>Website URL</strong></li>
                <li><strong>Social media handles</strong> (Twitter, GitHub, LinkedIn)</li>
              </ul>

              <h3 className="text-2xl font-bold mb-3 mt-6">3. Dataset Information</h3>
              <p className="mb-2">When you publish datasets, we collect:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li><strong>Dataset title and description</strong></li>
                <li><strong>Dataset files and sample data</strong></li>
                <li><strong>Pricing information</strong></li>
                <li><strong>Tags and categories</strong></li>
                <li><strong>Schema and metadata</strong></li>
              </ul>

              <h3 className="text-2xl font-bold mb-3 mt-6">4. Payment Information</h3>
              <p className="mb-4">
                We use <strong>Stripe</strong> for payment processing. We do not store your full credit card information on our servers. Stripe collects and processes:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Credit/debit card numbers</li>
                <li>Billing address</li>
                <li>Payment method details</li>
                <li>Transaction history</li>
              </ul>
              <p className="mb-4">
                For creators receiving payments, we collect your Stripe Connect account ID to facilitate payouts. Stripe handles all sensitive financial information according to their privacy policy.
              </p>

              <h3 className="text-2xl font-bold mb-3 mt-6">5. Usage Data</h3>
              <p className="mb-2">We automatically collect:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li><strong>Device information</strong> (browser type, OS, device type)</li>
                <li><strong>IP address</strong></li>
                <li><strong>Pages visited and time spent</strong></li>
                <li><strong>Interactions with features</strong> (datasets viewed, searches performed)</li>
                <li><strong>Error logs and debugging data</strong></li>
              </ul>

              <h3 className="text-2xl font-bold mb-3 mt-6">6. Social Features Data</h3>
              <p className="mb-2">When you use our social features, we collect:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li><strong>Comments and reviews</strong> on datasets</li>
                <li><strong>Follow/follower relationships</strong></li>
                <li><strong>Activity feed interactions</strong></li>
                <li><strong>Notifications preferences</strong></li>
                <li><strong>Trust level and reputation data</strong></li>
              </ul>

              <h3 className="text-2xl font-bold mb-3 mt-6">7. Communications</h3>
              <p className="mb-2">We collect:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li><strong>Feedback submissions</strong></li>
                <li><strong>Support requests</strong></li>
                <li><strong>Beta access applications</strong></li>
                <li><strong>Email correspondence</strong></li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-12">
              <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-2 border-t-4 border-black pt-6">
                <Users className="w-8 h-8" />
                How We Use Your Information
              </h2>

              <p className="mb-4">We use your information to:</p>
              
              <h3 className="text-xl font-bold mb-2 mt-4">Provide and Improve Services</h3>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Create and manage your account</li>
                <li>Enable dataset publishing and purchasing</li>
                <li>Process payments and payouts</li>
                <li>Provide customer support</li>
                <li>Send transactional emails (purchase confirmations, account updates)</li>
                <li>Improve platform features and user experience</li>
              </ul>

              <h3 className="text-xl font-bold mb-2 mt-4">Security and Fraud Prevention</h3>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Verify user identity</li>
                <li>Detect and prevent fraudulent transactions</li>
                <li>Monitor for suspicious activity</li>
                <li>Enforce our Terms of Service</li>
                <li>Protect against security threats</li>
              </ul>

              <h3 className="text-xl font-bold mb-2 mt-4">Analytics and Research</h3>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Analyze usage patterns and trends</li>
                <li>Measure feature effectiveness</li>
                <li>Conduct internal research</li>
                <li>Generate aggregated statistics (never identifying individuals)</li>
              </ul>

              <h3 className="text-xl font-bold mb-2 mt-4">Communication</h3>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Send important service updates</li>
                <li>Notify you of new features</li>
                <li>Respond to your inquiries</li>
                <li>Send beta access approvals</li>
              </ul>

              <p className="mt-4 p-4 bg-yellow-100 border-2 border-black rounded-lg">
                <strong>Note:</strong> We will never sell your personal information to third parties.
              </p>
            </section>

            {/* Data Sharing */}
            <section className="mb-12">
              <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-2 border-t-4 border-black pt-6">
                <Globe className="w-8 h-8" />
                Information Sharing and Disclosure
              </h2>

              <h3 className="text-2xl font-bold mb-3">Third-Party Services We Use</h3>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gray-50 border-2 border-black rounded-lg">
                  <h4 className="font-bold text-lg mb-2">Supabase (Database & Authentication)</h4>
                  <p className="mb-2">
                    <strong>Purpose:</strong> User authentication, database hosting, file storage
                  </p>
                  <p className="mb-2">
                    <strong>Data Shared:</strong> Email, username, profile data, dataset files
                  </p>
                  <p>
                    <strong>Privacy Policy:</strong> <a href="https://supabase.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a>
                  </p>
                </div>

                <div className="p-4 bg-gray-50 border-2 border-black rounded-lg">
                  <h4 className="font-bold text-lg mb-2">Stripe (Payment Processing)</h4>
                  <p className="mb-2">
                    <strong>Purpose:</strong> Payment processing, payouts to creators
                  </p>
                  <p className="mb-2">
                    <strong>Data Shared:</strong> Email, transaction amounts, payment methods
                  </p>
                  <p>
                    <strong>Privacy Policy:</strong> <a href="https://stripe.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a>
                  </p>
                </div>

                <div className="p-4 bg-gray-50 border-2 border-black rounded-lg">
                  <h4 className="font-bold text-lg mb-2">Netlify (Hosting)</h4>
                  <p className="mb-2">
                    <strong>Purpose:</strong> Website hosting and serverless functions
                  </p>
                  <p className="mb-2">
                    <strong>Data Shared:</strong> IP addresses, basic usage data
                  </p>
                  <p>
                    <strong>Privacy Policy:</strong> <a href="https://www.netlify.com/privacy/" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">netlify.com/privacy</a>
                  </p>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-3 mt-6">When We May Share Your Data</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Public Information:</strong> Your username, display name, bio, avatar, and published datasets are publicly visible</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
                <li><strong>Legal Requirements:</strong> If required by law, court order, or government request</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                <li><strong>Protection:</strong> To protect rights, property, or safety of SETIQUE, our users, or the public</li>
              </ul>

              <p className="p-4 bg-blue-100 border-2 border-black rounded-lg">
                <strong>Important:</strong> We do not sell, rent, or trade your personal information to third parties for marketing purposes.
              </p>
            </section>

            {/* Data Storage and Security */}
            <section className="mb-12">
              <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-2 border-t-4 border-black pt-6">
                <Lock className="w-8 h-8" />
                Data Storage and Security
              </h2>

              <h3 className="text-2xl font-bold mb-3">How We Protect Your Data</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Encryption:</strong> All data transmitted between your browser and our servers is encrypted using HTTPS/TLS</li>
                <li><strong>Password Security:</strong> Passwords are hashed and salted using industry-standard algorithms</li>
                <li><strong>Database Security:</strong> Row Level Security (RLS) policies prevent unauthorized data access</li>
                <li><strong>Access Controls:</strong> Strict access controls limit who can access user data</li>
                <li><strong>Regular Updates:</strong> We keep our systems updated with the latest security patches</li>
                <li><strong>Monitoring:</strong> Continuous monitoring for suspicious activity and security threats</li>
              </ul>

              <h3 className="text-2xl font-bold mb-3 mt-6">Data Retention</h3>
              <p className="mb-4">We retain your information for as long as:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Your account is active</li>
                <li>Needed to provide you services</li>
                <li>Required to comply with legal obligations</li>
                <li>Necessary to resolve disputes or enforce agreements</li>
              </ul>
              <p className="mb-4">
                When you delete your account, we will delete or anonymize your personal information within 30 days, except where we're required to retain it for legal purposes.
              </p>

              <div className="p-4 bg-red-100 border-2 border-black rounded-lg">
                <strong>⚠️ Security Notice:</strong> No method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </div>
            </section>

            {/* Your Rights and Choices */}
            <section className="mb-12">
              <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-2 border-t-4 border-black pt-6">
                <Shield className="w-8 h-8" />
                Your Rights and Choices
              </h2>

              <h3 className="text-2xl font-bold mb-3">Access and Control</h3>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information in your profile settings</li>
                <li><strong>Deletion:</strong> Request deletion of your account and personal data</li>
                <li><strong>Portability:</strong> Request your data in a structured, machine-readable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications (we don't currently send marketing emails)</li>
                <li><strong>Restriction:</strong> Request limitation of processing in certain circumstances</li>
              </ul>

              <h3 className="text-2xl font-bold mb-3 mt-6">How to Exercise Your Rights</h3>
              <p className="mb-4">To exercise any of these rights:</p>
              <ol className="list-decimal pl-6 mb-6 space-y-2">
                <li>Visit your <strong>Profile Settings</strong> page to update or delete information directly</li>
                <li>Contact us at <a href="mailto:joseph@anconsulting.us" className="text-blue-600 underline">joseph@anconsulting.us</a> for data access, portability, or deletion requests</li>
                <li>We will respond to your request within 30 days</li>
              </ol>

              <h3 className="text-2xl font-bold mb-3 mt-6">Cookie Management</h3>
              <p className="mb-4">
                We use essential cookies for authentication and session management. You can control cookies through your browser settings, but disabling cookies may affect platform functionality.
              </p>

              <h3 className="text-2xl font-bold mb-3 mt-6">GDPR Rights (EU Users)</h3>
              <p className="mb-2">If you're in the European Union, you have additional rights under GDPR:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Right to object to processing</li>
                <li>Right to lodge a complaint with your local data protection authority</li>
                <li>Right to withdraw consent at any time</li>
              </ul>

              <h3 className="text-2xl font-bold mb-3 mt-6">CCPA Rights (California Users)</h3>
              <p className="mb-2">If you're a California resident, you have rights under CCPA:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Right to know what personal information is collected</li>
                <li>Right to know if personal information is sold or disclosed</li>
                <li>Right to opt-out of the sale of personal information (we don't sell data)</li>
                <li>Right to non-discrimination for exercising your rights</li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section className="mb-12">
              <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-2 border-t-4 border-black pt-6">
                Children's Privacy
              </h2>
              <p className="mb-4">
                SETIQUE is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that we have collected information from a child under 13, we will delete it immediately.
              </p>
              <p className="mb-4">
                If you're a parent or guardian and believe your child has provided us with personal information, please contact us at <a href="mailto:joseph@anconsulting.us" className="text-blue-600 underline">joseph@anconsulting.us</a>.
              </p>
            </section>

            {/* International Data Transfers */}
            <section className="mb-12">
              <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-2 border-t-4 border-black pt-6">
                International Data Transfers
              </h2>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws different from those in your country.
              </p>
              <p className="mb-4">
                Our service providers (Supabase, Stripe, Netlify) operate globally and may process your data in the United States or other countries. By using SETIQUE, you consent to such transfers.
              </p>
              <p className="mb-4">
                When we transfer data internationally, we ensure appropriate safeguards are in place, such as standard contractual clauses approved by relevant authorities.
              </p>
            </section>

            {/* Changes to This Policy */}
            <section className="mb-12">
              <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-2 border-t-4 border-black pt-6">
                Changes to This Privacy Policy
              </h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, or legal requirements. When we make changes:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>We will update the "Last Updated" date at the top of this page</li>
                <li>For significant changes, we will notify you via email or a prominent notice on our platform</li>
                <li>We encourage you to review this policy periodically</li>
                <li>Your continued use of SETIQUE after changes constitutes acceptance of the updated policy</li>
              </ul>
            </section>

            {/* Contact Information */}
            <section className="mb-12">
              <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-2 border-t-4 border-black pt-6">
                <Mail className="w-8 h-8" />
                Contact Us
              </h2>
              <p className="mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="p-6 bg-yellow-100 border-2 border-black rounded-lg space-y-2">
                <p><strong>Email:</strong> <a href="mailto:joseph@anconsulting.us" className="text-blue-600 underline">joseph@anconsulting.us</a></p>
                <p><strong>Website:</strong> <a href="https://setique.com" className="text-blue-600 underline">setique.com</a></p>
                <p className="mt-4 text-sm">
                  We aim to respond to all privacy inquiries within 30 days.
                </p>
              </div>
            </section>

            {/* Additional Information */}
            <section className="mb-12">
              <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-2 border-t-4 border-black pt-6">
                Additional Information
              </h2>

              <h3 className="text-2xl font-bold mb-3">Cookies and Tracking Technologies</h3>
              <p className="mb-4">
                We use the following types of cookies and similar technologies:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for authentication and core platform functionality</li>
                <li><strong>Session Storage:</strong> Temporary storage for your session data</li>
                <li><strong>Local Storage:</strong> Used to remember your preferences (e.g., beta banner dismissal)</li>
              </ul>
              <p className="mb-4">
                We do not currently use analytics cookies or third-party tracking cookies. If we add analytics in the future, we will update this policy and provide opt-out options.
              </p>

              <h3 className="text-2xl font-bold mb-3 mt-6">Do Not Track</h3>
              <p className="mb-4">
                Some browsers have "Do Not Track" features. Currently, there is no universal standard for how to respond to these signals. We do not currently respond to Do Not Track signals, but we don't track you across third-party websites.
              </p>

              <h3 className="text-2xl font-bold mb-3 mt-6">Third-Party Links</h3>
              <p className="mb-4">
                Our platform may contain links to third-party websites (e.g., users' personal websites, GitHub profiles). We are not responsible for the privacy practices of these external sites. We encourage you to read their privacy policies.
              </p>

              <h3 className="text-2xl font-bold mb-3 mt-6">Beta Access System</h3>
              <p className="mb-4">
                During our beta phase, we collect additional information about beta applicants including full name, intended use case, and access code requests. This information is used solely for managing beta access and will not be shared with third parties.
              </p>
            </section>

            {/* Summary */}
            <section className="mb-8">
              <div className="p-6 bg-cyan-100 border-4 border-black rounded-2xl">
                <h2 className="text-2xl font-extrabold mb-4">Privacy Policy Summary</h2>
                <ul className="space-y-2">
                  <li>✅ We collect only the data necessary to provide our services</li>
                  <li>✅ We never sell your personal information</li>
                  <li>✅ We use industry-standard security measures</li>
                  <li>✅ You have full control over your data</li>
                  <li>✅ We're transparent about our third-party services</li>
                  <li>✅ We comply with GDPR, CCPA, and other privacy regulations</li>
                  <li>✅ You can delete your account and data at any time</li>
                </ul>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="text-center">
          <Link 
            to="/" 
            className="inline-block px-8 py-4 bg-yellow-300 border-4 border-black font-bold text-lg hover:bg-yellow-400 transition shadow-[6px_6px_0_#000]"
          >
            Return to SETIQUE
          </Link>
        </div>
      </main>
    </div>
  )
}
