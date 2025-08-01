import React from 'react';
import Navigation from "@/components/Navigation";

export default function DataProcessingAgreementPage() {
  React.useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        const offset = 96;
        const y = window.pageYOffset + el.getBoundingClientRect().top - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 lg:px-8 pt-24 pb-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl font-serif mb-6">
            Data Processing Agreement
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            For the <span className="text-cosmic font-serif">Creators Multiverse</span> platform
          </p>
          <p className="text-sm text-gray-400">
            Last updated: August 1, 2025
          </p>
        </header>

        <article className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8 mb-8">
            <p className="text-gray-300 text-lg leading-relaxed">
              This Data Processing Agreement governs how <span className="text-cosmic font-serif">Creators Multiverse</span> handles your data in compliance with GDPR and international privacy regulations. We're committed to maintaining the highest standards of data protection while delivering revolutionary AI-powered content creation services.
            </p>
          </div>

          <div className="space-y-12">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="parties-scope" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Parties & Scope of Processing
              </h2>
              <div className="space-y-6 text-gray-300">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">📋 Agreement Overview</h3>
                  <p className="text-lg leading-relaxed mb-4">
                    This Agreement is between <span className="text-cosmic font-serif">Creators Multiverse</span> ("Data Controller") and any third-party service providers ("Data Processors") who process personal data on our behalf to deliver AI content creation services.
                  </p>
                  <div className="bg-cosmic/10 border border-cosmic/20 rounded-lg p-4">
                    <p className="text-sm">
                      <strong className="text-cosmic">Contact:</strong> privacy@creators-multiverse.com
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h4 className="font-semibold text-white mb-3">🏢 Data Controller</h4>
                    <p className="text-sm mb-2"><strong>Entity:</strong> Creators Multiverse Platform</p>
                    <p className="text-sm mb-2"><strong>Role:</strong> Determines purposes and means of processing</p>
                    <p className="text-sm"><strong>Responsibility:</strong> Ensuring GDPR compliance</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h4 className="font-semibold text-white mb-3">⚙️ Data Processors</h4>
                    <p className="text-sm mb-2"><strong>Role:</strong> Process data on Controller's behalf</p>
                    <p className="text-sm mb-2"><strong>Obligation:</strong> Follow documented instructions</p>
                    <p className="text-sm"><strong>Standard:</strong> Maintain equivalent protection</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="processing-details" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Nature & Purpose of Processing
              </h2>
              <div className="space-y-6 text-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-blue-300 mb-4">🎨 Content Generation</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>AI-powered content creation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Image and text processing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Personalization algorithms</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-green-300 mb-4">📱 Platform Operations</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>User authentication</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Content delivery</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Performance monitoring</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-purple-300 mb-4">📊 Analytics & Support</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Usage analytics</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Customer support</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Security monitoring</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-cosmic/10 border border-cosmic/20 rounded-lg p-6">
                  <h3 className="font-semibold text-cosmic mb-3">📝 Processing Duration</h3>
                  <p className="text-sm leading-relaxed">
                    Processing continues for the duration of your active account plus 90 days for secure deletion, except where longer retention is required by law or legitimate business interests (e.g., fraud prevention, legal compliance).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="data-categories" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Categories of Data & Subjects
              </h2>
              <div className="space-y-6 text-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">👥 Data Subjects</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Content creators and influencers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Social media managers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Business account holders</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Platform administrators</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">📊 Data Categories</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Identity & contact information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Account credentials & preferences</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Content generation data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Usage analytics & performance metrics</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-red-300 mb-4">🚫 Prohibited Data Processing</h3>
                  <p className="text-sm leading-relaxed mb-3">
                    Processors are strictly prohibited from processing the following data types without explicit consent:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Sensitive personal identifiers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Financial information beyond billing</span>
                      </li>
                    </ul>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Biometric or health data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Political or religious beliefs</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="processor-obligations" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Processor Obligations & Security
              </h2>
              <div className="space-y-6 text-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">🔒 Security Requirements</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>AES-256 encryption for data at rest</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>TLS 1.3+ for data in transit</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Regular security audits & penetration testing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Multi-factor authentication for admin access</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">📋 Compliance Obligations</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Process only on documented instructions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Ensure staff confidentiality commitments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Notify breaches within 24 hours</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Support data subject rights requests</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-yellow-300 mb-4">⚠️ Incident Response</h3>
                  <p className="text-sm leading-relaxed mb-3">
                    In the event of a data breach or security incident:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-300 mb-1">24 Hours</div>
                      <div className="text-xs">Initial notification to Controller</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-300 mb-1">72 Hours</div>
                      <div className="text-xs">Full incident report with analysis</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-300 mb-1">Ongoing</div>
                      <div className="text-xs">Remediation and monitoring</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="subprocessors" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Sub-processors & International Transfers
              </h2>
              <div className="space-y-6 text-gray-300">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">🔗 Approved Sub-processors</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/20">
                      <thead className="bg-white/10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Service</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Provider</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Purpose</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        <tr className="hover:bg-white/5">
                          <td className="px-6 py-4 text-sm font-medium text-white">Database & Auth</td>
                          <td className="px-6 py-4 text-sm text-gray-300">Supabase</td>
                          <td className="px-6 py-4 text-sm text-gray-300">User data & authentication</td>
                          <td className="px-6 py-4 text-sm text-gray-300">EU/US</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="px-6 py-4 text-sm font-medium text-white">Payment Processing</td>
                          <td className="px-6 py-4 text-sm text-gray-300">Stripe</td>
                          <td className="px-6 py-4 text-sm text-gray-300">Credit card & billing</td>
                          <td className="px-6 py-4 text-sm text-gray-300">Global</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="px-6 py-4 text-sm font-medium text-white">Email Services</td>
                          <td className="px-6 py-4 text-sm text-gray-300">Resend</td>
                          <td className="px-6 py-4 text-sm text-gray-300">Transactional emails</td>
                          <td className="px-6 py-4 text-sm text-gray-300">EU/US</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="px-6 py-4 text-sm font-medium text-white">AI Processing</td>
                          <td className="px-6 py-4 text-sm text-gray-300">OpenAI</td>
                          <td className="px-6 py-4 text-sm text-gray-300">Content generation</td>
                          <td className="px-6 py-4 text-sm text-gray-300">US</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-cosmic/10 border border-cosmic/20 rounded-lg p-6">
                  <h3 className="font-semibold text-cosmic mb-3">🌍 International Data Transfers</h3>
                  <p className="text-sm leading-relaxed">
                    When data is transferred outside the EEA, we ensure adequate protection through Standard Contractual Clauses (SCCs), adequacy decisions, or other approved transfer mechanisms. All international transfers are documented and regularly reviewed for continued adequacy.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="contact-dpa" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Agreement Contact & Compliance
              </h2>
              <div className="space-y-6 text-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">📧 Data Protection Team</h3>
                    <p className="mb-3">
                      Email: <a href="mailto:dpo@creators-multiverse.com" className="text-cosmic hover:text-white transition-colors font-semibold">dpo@creators-multiverse.com</a>
                    </p>
                    <p className="text-sm">For DPA-related matters and compliance questions</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">🔍 Audit Rights</h3>
                    <p className="text-sm">
                      Data Controllers may audit processors with 30 days notice. SOC 2 Type 2 reports or equivalent certifications may satisfy audit requirements.
                    </p>
                  </div>
                </div>

                <div className="bg-cosmic/10 border border-cosmic/20 rounded-lg p-6">
                  <h3 className="font-semibold text-cosmic mb-3">📜 Agreement Validity</h3>
                  <p className="text-sm leading-relaxed">
                    This Data Processing Agreement is effective as of the last updated date and remains in force for as long as personal data is processed under the main service agreement. Any conflicts between this DPA and other agreements will be resolved in favor of this DPA regarding data protection matters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}