import React from 'react';
import Navigation from "@/components/Navigation";

export default function CookiesPage() {
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
            Cookie Policy
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
              Welcome to <span className="text-cosmic font-serif">Creators Multiverse</span>! To provide you with a smooth, secure, and personalized browsing experience, our platform uses cookies and similar technologies. This policy explains what cookies are, how and why we use them, and how you can manage your preferences.
            </p>
          </div>

          <div className="space-y-12">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="what-are-cookies" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                What are Cookies?
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                A "cookie" is a small text file that a website saves on your computer or mobile device when you visit the site. It allows the website to remember, for a period of time, your actions and preferences (such as login data, language, or other display preferences). This way, you don't have to re-enter them every time you return to the site or navigate from one page to another.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="how-we-use-cookies" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                How We Use Cookies
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                We classify the cookies we use into the following categories:
              </p>

              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">🔒 Strictly Necessary Cookies</h3>
                  <p className="text-gray-300 mb-4">
                    These cookies are essential for the platform to function and cannot be disabled. They are usually set in response to your actions, such as logging into your account, managing your session, or setting privacy preferences.
                  </p>
                  <ul className="space-y-2">
                    <li className="text-gray-300 flex items-start gap-2">
                      <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong className="text-white">Authentication:</strong> Keep you securely logged in during your visit.</span>
                    </li>
                    <li className="text-gray-300 flex items-start gap-2">
                      <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong className="text-white">Security:</strong> Help us detect malicious activities and protect against CSRF attacks.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">📊 Performance and Analytics Cookies</h3>
                  <p className="text-gray-300 mb-4">
                    These cookies allow us to collect aggregated and anonymous data about how visitors interact with our platform. The information helps us count visits, understand which pages are most popular, and identify traffic sources.
                  </p>
                  <ul className="space-y-2">
                    <li className="text-gray-300 flex items-start gap-2">
                      <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong className="text-white">Google Analytics:</strong> We use this service to understand user behavior and optimize content and functionality.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">⚙️ Functional Cookies</h3>
                  <p className="text-gray-300">
                    These cookies allow the site to provide enhanced functionality and greater personalization. For example, they may remember choices you've made (such as your username or region). They may be set by us or by third-party providers whose services we've added to our pages.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">🎯 Marketing and Advertising Cookies</h3>
                  <p className="text-gray-300 mb-4">
                    These cookies are used to deliver advertisements that are more relevant to you and your interests. They may be set through our site by our advertising partners.
                  </p>
                  <ul className="space-y-2">
                    <li className="text-gray-300 flex items-start gap-2">
                      <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong className="text-white">Meta (Facebook) Pixel & TikTok Pixel:</strong> We use these to measure the effectiveness of our advertising campaigns.</span>
                    </li>
                    <li className="text-gray-300 flex items-start gap-2">
                      <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong className="text-white">LinkedIn Insight Tag:</strong> Helps us track conversions and retarget visitors with relevant content.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="cookie-list" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                List of Main Cookies Used
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                Below is a list of the main first-party and third-party cookies we use. Note that this list is not exhaustive, but represents the main categories.
              </p>
              
              <div className="overflow-x-auto rounded-lg border border-white/20">
                <table className="min-w-full divide-y divide-white/20">
                  <thead className="bg-white/10">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Cookie</th>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Provider</th>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Purpose</th>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">session_id / auth_token</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Creators Multiverse</td>
                      <td className="px-6 py-4 text-sm text-gray-300">Strictly necessary: Keeps user authenticated during session.</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Session</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">_ga, _gid</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Google Analytics</td>
                      <td className="px-6 py-4 text-sm text-gray-300">Analytics: Distinguishes users for statistical purposes.</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">2 years</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">_fbp</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Meta (Facebook)</td>
                      <td className="px-6 py-4 text-sm text-gray-300">Marketing: Identifies browsers for advertising and campaign analysis purposes.</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">3 months</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">_ttp</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">TikTok</td>
                      <td className="px-6 py-4 text-sm text-gray-300">Marketing: Measures ad performance and delivers personalized advertisements.</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">13 months</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">li_sugr, AnalyticsSyncHistory</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">LinkedIn</td>
                      <td className="px-6 py-4 text-sm text-gray-300">Marketing: Tracks conversions and enables retargeting for content creation tools.</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">30 days</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">stripe_mid, stripe_sid</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Stripe</td>
                      <td className="px-6 py-4 text-sm text-gray-300">Strictly necessary: Fraud prevention and payment security.</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="manage-cookies" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Your Options and How to Manage Cookies
              </h2>
              <div className="space-y-6">
                <p className="text-gray-300 text-lg leading-relaxed">
                  You have full control over cookies. On your first visit to our site, you can choose which categories of cookies you accept through the consent banner. Strictly necessary cookies do not require consent.
                </p>
                <p className="text-gray-300 text-lg leading-relaxed">
                  You can also modify cookie settings directly from your browser. You can delete all cookies that are already on your device and set most browsers to prevent them from being placed. Below are instructions for the most popular browsers:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" 
                     className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors group">
                    <div className="text-cosmic font-semibold group-hover:text-white">🌐 Google Chrome</div>
                  </a>
                  <a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer"
                     className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors group">
                    <div className="text-cosmic font-semibold group-hover:text-white">🦊 Mozilla Firefox</div>
                  </a>
                  <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer"
                     className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors group">
                    <div className="text-cosmic font-semibold group-hover:text-white">🍎 Apple Safari</div>
                  </a>
                  <a href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer"
                     className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors group">
                    <div className="text-cosmic font-semibold group-hover:text-white">🔷 Microsoft Edge</div>
                  </a>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-300">
                    <strong className="text-red-200">⚠️ Warning:</strong> If you block cookies (especially strictly necessary ones), various parts of our site may not function properly, including our AI content generation tools and account management features.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="third-party-services" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Third-Party Services and Data Processing
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Our platform integrates with various third-party services to provide you with the best content creation experience:
              </p>
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300"><strong className="text-white">Social Media APIs:</strong> We connect with X (Twitter), Instagram, LinkedIn, and Facebook APIs to publish your AI-generated content directly to these platforms.</span>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300"><strong className="text-white">AI Processing Services:</strong> Your content requests are processed through secure AI systems to generate viral-ready content.</span>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-cosmic rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300"><strong className="text-white">Analytics Platforms:</strong> We use analytics to understand how users interact with our content generation tools and optimize the platform.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="policy-updates" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Changes to the Cookie Policy
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                We may update this policy periodically to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Therefore, please visit this page regularly to stay informed about how we use cookies.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <h2 id="contact" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-cosmic rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                Contact Us
              </h2>
              <div className="space-y-4">
                <p className="text-gray-300 text-lg leading-relaxed">
                  If you have questions about the use of cookies on our platform, you can contact us at: 
                  <a href="mailto:contact@creators-multiverse.com" className="text-cosmic hover:text-white transition-colors font-semibold ml-1">
                    contact@creators-multiverse.com
                  </a>
                </p>
                <p className="text-gray-300 text-lg leading-relaxed">
                  For more information about our AI-powered content generation platform, visit us at 
                  <a href="https://creators-multiverse.com" target="_blank" rel="noopener noreferrer" 
                     className="text-cosmic hover:text-white transition-colors font-semibold ml-1">
                    creators-multiverse.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}