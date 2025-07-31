import Link from 'next/link'
import { Brain } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-black to-gray-800 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">OPSAI</span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
            <Link href="/careers" className="text-gray-600 hover:text-gray-900">Careers</Link>
            <Link href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy</Link>
            <Link href="/" className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Effective Date: January 1, 2024</p>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                These Terms of Service ("Terms") govern your use of OPSAI's business intelligence platform and related services ("Services") provided by OPSAI Inc. ("OPSAI," "we," "us," or "our").
              </p>
              <p className="text-gray-600 leading-relaxed">
                By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Services.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                OPSAI provides an AI-powered business intelligence platform that helps organizations:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Discover and connect existing business systems</li>
                <li>Unify data across multiple applications</li>
                <li>Create intelligent dashboards and analytics</li>
                <li>Automate business workflows and processes</li>
                <li>Generate insights and recommendations</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Responsibilities</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Creation</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                To use our Services, you must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Acceptable Use</h3>
              <p className="text-gray-600 leading-relaxed mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Use the Services for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Services</li>
                <li>Upload malicious code or harmful content</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Subscription and Payment</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Subscription Plans</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our Services are offered through various subscription plans. Pricing and features are detailed on our website and may change with reasonable notice.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Payment Terms</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Subscription fees are billed in advance</li>
                <li>All fees are non-refundable unless required by law</li>
                <li>You authorize automatic renewal unless cancelled</li>
                <li>Price changes require 30 days advance notice</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Ownership and Privacy</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Your Data</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You retain ownership of all data you provide to or generate through our Services. We do not claim ownership rights to your business data.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Processing</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We process your data solely to provide the Services as described in our Privacy Policy. We implement appropriate security measures to protect your data.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                The Services, including all software, content, and technology, are owned by OPSAI and protected by intellectual property laws. You receive a limited license to use the Services subject to these Terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Service Level Agreement</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We strive to maintain 99.9% uptime for our Services. Service credits may be available for qualifying outages as detailed in our SLA documentation.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To the maximum extent permitted by law, OPSAI shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Services.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Either party may terminate these Terms at any time. Upon termination, your access to the Services will cease, and you may export your data for a reasonable period.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                For questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>OPSAI Inc.</strong></p>
                <p className="text-gray-700 mb-2">Legal Department</p>
                <p className="text-gray-700 mb-2">Email: legal@opsai.com</p>
                <p className="text-gray-700 mb-2">Phone: +1 (555) 123-OPSAI</p>
                <p className="text-gray-700">Address: 123 Innovation Drive, San Francisco, CA 94107</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
} 