import Link from 'next/link'
import { Brain } from 'lucide-react'

export default function PrivacyPage() {
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
            <Link href="/terms" className="text-gray-600 hover:text-gray-900">Terms</Link>
            <Link href="/" className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Effective Date: January 1, 2024</p>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                At OPSAI Inc. ("OPSAI," "we," "us," or "our"), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our business intelligence platform and related services.
              </p>
              <p className="text-gray-600 leading-relaxed">
                By using our services, you agree to the collection and use of information in accordance with this policy. We will not use or share your information with anyone except as described in this Privacy Policy.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We collect information you provide directly to us, such as when you create an account, contact us, or use our services:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Name, email address, and contact information</li>
                <li>Company information and business details</li>
                <li>Account credentials and preferences</li>
                <li>Payment and billing information</li>
                <li>Communications with our support team</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Business Data</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Through our platform, we process business data you provide or authorize us to access:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Data from connected business systems and applications</li>
                <li>Analytics and performance metrics</li>
                <li>Integration configurations and workflows</li>
                <li>Usage patterns and system interactions</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical Information</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We automatically collect certain technical information:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>IP addresses, browser type, and device information</li>
                <li>Log files, cookies, and similar technologies</li>
                <li>Usage statistics and performance metrics</li>
                <li>Error reports and diagnostic data</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">We use collected information for:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Providing, maintaining, and improving our services</li>
                <li>Processing payments and managing accounts</li>
                <li>Communicating with you about updates and support</li>
                <li>Analyzing usage patterns to enhance platform performance</li>
                <li>Detecting and preventing fraud or security threats</li>
                <li>Complying with legal obligations and industry standards</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>End-to-end encryption for data transmission and storage</li>
                <li>Multi-factor authentication and access controls</li>
                <li>Regular security audits and compliance certifications</li>
                <li>SOC 2 Type II and ISO 27001 compliance</li>
                <li>Secure data centers with 24/7 monitoring</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Access: Request a copy of your personal data</li>
                <li>Correction: Update or correct inaccurate information</li>
                <li>Deletion: Request deletion of your personal data</li>
                <li>Portability: Export your data in a structured format</li>
                <li>Opt-out: Unsubscribe from marketing communications</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>OPSAI Inc.</strong></p>
                <p className="text-gray-700 mb-2">Privacy Officer</p>
                <p className="text-gray-700 mb-2">Email: privacy@opsai.com</p>
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