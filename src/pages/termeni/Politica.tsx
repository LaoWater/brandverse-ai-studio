import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from "@/components/Navigation";

export default function PoliticaPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        const offset = 96;
        const y = window.pageYOffset + el.getBoundingClientRect().top - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hash]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 lg:px-8 pt-24 pb-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl font-serif mb-6">
            Privacy Policy
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
              Your privacy is at the heart of everything we do at <span className="text-cosmic font-serif">Creators Multiverse</span>. This policy explains how we collect, use, and protect your information while providing cutting-edge AI content creation services that transform your social media presence.
            </p>
          </div>

          <div className="space-y-12">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="data-collection" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Data Collection & Usage
              </h2>
              <div className="space-y-6 text-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">📝 Account Information</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Email address and profile details</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Payment information (securely processed)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Communication preferences</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">🎨 Content Data</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>AI-generated content and prompts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Social media connections (with permission)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Usage patterns and preferences</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">📊 Analytics Data</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Platform usage and feature interactions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Performance metrics and engagement data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Device and browser information</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">🔗 Social Media Integration</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Publishing permissions (Instagram, Twitter/X, LinkedIn)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Public profile information (when connected)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Content scheduling and posting history</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="data-usage" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                How We Use Your Data
              </h2>
              <div className="space-y-6 text-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-green-300 mb-4">🚀 Service Enhancement</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Powering AI content generation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Personalizing content recommendations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Improving platform functionality</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-blue-300 mb-4">🔧 Platform Operations</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Account management and billing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Customer support and communication</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Security and fraud prevention</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-purple-300 mb-4">📈 Analytics & Insights</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Performance tracking and optimization</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Understanding user behavior patterns</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Developing new AI features</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-cosmic/10 border border-cosmic/20 rounded-lg p-6">
                  <h3 className="font-semibold text-cosmic mb-3">🤖 AI Training & Improvement</h3>
                  <p className="text-sm leading-relaxed">
                    We use aggregated, anonymized data to continuously improve our AI algorithms. This helps us create better content suggestions, understand trending topics, and enhance the overall quality of generated content. Your individual data is never used to train models accessible to other users.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="data-protection" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Data Protection & Security
              </h2>
              <div className="space-y-6 text-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">🔒 Security Measures</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>End-to-end encryption for sensitive data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Regular security audits and monitoring</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Secure data centers with backup systems</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Multi-factor authentication support</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">⚖️ Legal Compliance</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>GDPR and CCPA compliance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Data minimization principles</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Transparent data processing practices</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Regular privacy impact assessments</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="your-rights" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Your Privacy Rights
              </h2>
              <div className="space-y-6 text-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">👁️ Access & Transparency</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>View all data we have about you</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Download your content and data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Understand how data is processed</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">✏️ Control & Modification</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Correct inaccurate information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Update your preferences anytime</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Opt-out of certain data processing</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">🗑️ Deletion & Portability</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Delete your account and data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Export data in portable formats</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Restrict specific data processing</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">⚖️ Legal Protections</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>File complaints with data authorities</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Withdraw consent for data processing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Object to automated decision-making</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-cosmic/10 border border-cosmic/20 rounded-lg p-6">
                  <h3 className="font-semibold text-cosmic mb-3">💌 Exercising Your Rights</h3>
                  <p className="text-sm leading-relaxed">
                    To exercise any of these rights, contact us at <a href="mailto:privacy@creators-multiverse.com" className="text-cosmic hover:text-white transition-colors font-semibold">privacy@creators-multiverse.com</a>. We'll respond within 30 days and guide you through the process. Most requests can be fulfilled directly through your account settings.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="contact-privacy" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Privacy Contact & Updates
              </h2>
              <div className="space-y-6 text-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">📧 Data Protection Officer</h3>
                    <p className="mb-3">
                      Email: <a href="mailto:privacy@creators-multiverse.com" className="text-cosmic hover:text-white transition-colors font-semibold">privacy@creators-multiverse.com</a>
                    </p>
                    <p className="text-sm">For all privacy-related questions and requests</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">🔄 Policy Updates</h3>
                    <p className="text-sm">
                      We may update this policy to reflect changes in our services or legal requirements. We'll notify you of significant changes via email or platform notifications.
                    </p>
                  </div>
                </div>

                <div className="bg-cosmic/10 border border-cosmic/20 rounded-lg p-6">
                  <h3 className="font-semibold text-cosmic mb-3">🌟 Your Privacy, Our Priority</h3>
                  <p className="text-sm leading-relaxed">
                    At <span className="text-cosmic font-serif">Creators Multiverse</span>, we believe privacy is fundamental to creativity. We're committed to protecting your data while empowering you with the most advanced AI content creation tools available.
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