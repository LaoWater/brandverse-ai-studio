import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from "@/components/Navigation";

export default function TermeniPage() {
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
    }
  }, [hash]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 lg:px-8 pt-24 pb-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl font-serif mb-6">
            Terms & Conditions
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
              Welcome to <span className="text-cosmic font-serif">Creators Multiverse</span>! This agreement governs your use of our revolutionary AI-powered content creation platform. By accessing our services, you enter a universe where creativity meets technology to transform your social media presence.
            </p>
          </div>

          <div className="space-y-12">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="introduction" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Agreement Overview
              </h2>
              <div className="space-y-4 text-gray-300">
                <p className="text-lg leading-relaxed">
                  These Terms constitute a legal agreement between you and <span className="text-cosmic font-serif">Creators Multiverse</span> ("Platform", "we", or "us"). By using our AI-powered content generation services, you agree to be bound by these Terms.
                </p>
                <p className="text-lg leading-relaxed">
                  <strong className="text-white">By using the Platform and any Services, you:</strong>
                </p>
                <ul className="space-y-3 ml-6">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                    <span>Acknowledge that you have read and understood these Terms</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                    <span>Agree to be bound by these Terms and our Privacy Policy</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                    <span>Commit to using our AI tools responsibly and ethically</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                    <span>Understand the innovative nature of our AI content generation technology</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="definitions" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Definitions & Key Terms
              </h2>
              <div className="space-y-6 text-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Platform</h4>
                    <p className="text-sm">The AI-powered content creation service operated through creators-multiverse.com, including all features, interfaces, and connected services.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">User/Creator</h4>
                    <p className="text-sm">Any individual who accesses and uses our platform to generate viral content for social media platforms.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">AI Services</h4>
                    <p className="text-sm">Our proprietary artificial intelligence tools for generating posts, captions, images, and viral content strategies.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Generated Content</h4>
                    <p className="text-sm">Any text, images, strategies, or materials created by our AI systems based on your inputs and preferences.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Social Connections</h4>
                    <p className="text-sm">Integrated publishing to Instagram, Twitter/X, LinkedIn, Facebook, and other supported platforms.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Credits System</h4>
                    <p className="text-sm">Our usage-based pricing model where each AI generation consumes credits from your account balance.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="services" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Our Revolutionary AI Services
              </h2>
              <div className="space-y-6 text-gray-300">
                <p className="text-lg leading-relaxed">
                  <span className="text-cosmic font-serif">Creators Multiverse</span> empowers content creators with cutting-edge AI technology to generate viral content across all major social media platforms. Our services transform your creative ideas into engagement-driving content.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">🚀 AI Content Generation</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Viral post creation for Instagram, TikTok, Twitter/X</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>AI-powered captions and hashtag optimization</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Professional LinkedIn content strategies</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">🎨 Visual Content Creation</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>AI-generated images and graphics</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Brand-consistent visual assets</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Custom image editing and enhancement</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">📱 Direct Publishing</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>One-click publishing to multiple platforms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Scheduled posting and content calendar</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Cross-platform optimization</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">📊 Analytics & Insights</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Performance tracking and optimization</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>Audience engagement analysis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                        <span>AI-driven content recommendations</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-cosmic/10 border border-cosmic/20 rounded-lg p-6">
                  <h3 className="font-semibold text-cosmic mb-3">✨ Our AI Promise</h3>
                  <p className="text-sm leading-relaxed">
                    We leverage state-of-the-art artificial intelligence to understand trends, analyze successful content patterns, and generate material that resonates with your target audience. Our AI continuously learns and evolves to ensure your content stays ahead of the curve.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="contact" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Contact & Support
              </h2>
              <div className="space-y-6 text-gray-300">
                <p className="text-lg leading-relaxed">
                  Have questions about <span className="text-cosmic font-serif">Creators Multiverse</span>? We're here to help you unleash your creative potential!
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">📧 General Support</h3>
                    <p className="mb-3">
                      Email: <a href="mailto:contact@creators-multiverse.com" className="text-cosmic hover:text-white transition-colors font-semibold">contact@creators-multiverse.com</a>
                    </p>
                    <p className="text-sm">Response time: Within 24 hours</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">🔒 Privacy & Legal</h3>
                    <p className="mb-3">
                      Email: <a href="mailto:privacy@creators-multiverse.com" className="text-cosmic hover:text-white transition-colors font-semibold">privacy@creators-multiverse.com</a>
                    </p>
                    <p className="text-sm">For data protection and legal matters</p>
                  </div>
                </div>

                <div className="bg-cosmic/10 border border-cosmic/20 rounded-lg p-6">
                  <h3 className="font-semibold text-cosmic mb-3">🌟 Thank You for Choosing Creators Multiverse</h3>
                  <p className="text-sm leading-relaxed">
                    By agreeing to these terms, you're joining a revolutionary platform that empowers creators worldwide. Together, we're building the future of AI-powered content creation.
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