import React from 'react';
import Navigation from "@/components/Navigation";

// This component uses standard TailwindCSS prose classes for styling the article content.
// Ensure you have the @tailwindcss/typography plugin installed.

export default function CookiesPage() {
  // The useEffect for scrolling to a hash is good practice, so we'll keep it.
  React.useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        const offset = 96; // Offset for a fixed header, adjust if needed
        const y = window.pageYOffset + el.getBoundingClientRect().top - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <div className="bg-white min-h-screen py-12">
      <Navigation /> 
      <div className="container mx-auto px-4 lg:px-8 mt-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl font-serif !text-gray-900">
            Cookie Policy
          </h1>
          <p className="mt-4 text-lg text-gray-600 !text-gray-600">
            For the Creators Multiverse platform
          </p>
          <p className="mt-2 text-sm text-gray-500 !text-gray-500">
            Last updated: August 1, 2025
          </p>
        </header>

        <article className="prose prose-lg max-w-4xl mx-auto prose-p:!text-gray-700 prose-h2:!text-gray-900 prose-h3:!text-gray-800 prose-li:!text-gray-700 prose-strong:!text-gray-900 prose-a:!text-blue-600 hover:prose-a:!text-blue-800">
          <p className="!text-gray-700">
            Welcome to Creators Multiverse! To provide you with a smooth, secure, and personalized browsing experience, our platform uses cookies and similar technologies. This policy explains what cookies are, how and why we use them, and how you can manage your preferences.
          </p>

          <h2 id="what-are-cookies" className="!text-gray-900">What are Cookies?</h2>
          <p className="!text-gray-700">
            A "cookie" is a small text file that a website saves on your computer or mobile device when you visit the site. It allows the website to remember, for a period of time, your actions and preferences (such as login data, language, or other display preferences). This way, you don't have to re-enter them every time you return to the site or navigate from one page to another.
          </p>

          <h2 id="how-we-use-cookies" className="!text-gray-900">How We Use Cookies</h2>
          <p className="!text-gray-700">
            We classify the cookies we use into the following categories:
          </p>

          <h3 className="!text-gray-800">1. Strictly Necessary Cookies</h3>
          <p className="!text-gray-700">
            These cookies are essential for the platform to function and cannot be disabled. They are usually set in response to your actions, such as logging into your account, managing your session, or setting privacy preferences. Without these cookies, essential services like accessing your account or processing payments would not be able to function.
          </p>
          <ul>
            <li className="!text-gray-700"><strong className="!text-gray-900">Authentication:</strong> Keep you securely logged in during your visit.</li>
            <li className="!text-gray-700"><strong className="!text-gray-900">Security:</strong> Help us detect malicious activities and protect against CSRF (Cross-Site Request Forgery) attacks.</li>
          </ul>

          <h3 className="!text-gray-800">2. Performance and Analytics Cookies</h3>
          <p className="!text-gray-700">
            These cookies allow us to collect aggregated and anonymous data about how visitors interact with our platform. The information helps us count visits, understand which pages are most popular, and identify traffic sources. All this data helps us improve performance and user experience.
          </p>
          <ul>
            <li className="!text-gray-700"><strong className="!text-gray-900">Google Analytics:</strong> We use this service to understand user behavior and optimize content and functionality.</li>
          </ul>

          <h3 className="!text-gray-800">3. Functional Cookies</h3>
          <p className="!text-gray-700">
            These cookies allow the site to provide enhanced functionality and greater personalization. For example, they may remember choices you've made (such as your username or region). They may be set by us or by third-party providers whose services we've added to our pages (e.g., integration with social media platforms for content sharing).
          </p>

          <h3 className="!text-gray-800">4. Marketing and Advertising Cookies</h3>
          <p className="!text-gray-700">
            These cookies are used to deliver advertisements that are more relevant to you and your interests. They may be set through our site by our advertising partners. They don't store personal information directly, but are based on uniquely identifying your browser and internet device. If you don't allow these cookies, you will experience less targeted advertising.
          </p>
          <ul>
            <li className="!text-gray-700"><strong className="!text-gray-900">Meta (Facebook) Pixel & TikTok Pixel:</strong> We use these to measure the effectiveness of our advertising campaigns and to deliver personalized ads on these platforms.</li>
            <li className="!text-gray-700"><strong className="!text-gray-900">LinkedIn Insight Tag:</strong> Helps us track conversions and retarget visitors with relevant content about our AI-powered content generation tools.</li>
          </ul>

          <h2 id="cookie-list" className="!text-gray-900">List of Main Cookies Used</h2>
          <p className="!text-gray-700">Below is a list of the main first-party and third-party cookies we use. Note that this list is not exhaustive, but represents the main categories.</p>
          <div className="overflow-x-auto my-6">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cookie</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">session_id / auth_token</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Creators Multiverse</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Strictly necessary: Keeps user authenticated during session.</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Session</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">_ga, _gid</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Google Analytics</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Analytics: Distinguishes users for statistical purposes.</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 years</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">_fbp</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Meta (Facebook)</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Marketing: Identifies browsers for advertising and campaign analysis purposes.</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3 months</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">_ttp</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">TikTok</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Marketing: Measures ad performance and delivers personalized advertisements.</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">13 months</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">li_sugr, AnalyticsSyncHistory</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">LinkedIn</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Marketing: Tracks conversions and enables retargeting for content creation tools.</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">30 days</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">stripe_mid, stripe_sid</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Stripe</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Strictly necessary: Fraud prevention and payment security.</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 year</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 id="manage-cookies" className="!text-gray-900">Your Options and How to Manage Cookies</h2>
          <p className="!text-gray-700">
            You have full control over cookies. On your first visit to our site, you can choose which categories of cookies you accept through the consent banner. Strictly necessary cookies do not require consent.
          </p>
          <p className="!text-gray-700">
            You can also modify cookie settings directly from your browser. You can delete all cookies that are already on your device and set most browsers to prevent them from being placed. Below are instructions for the most popular browsers:
          </p>
          <ul>
            <li className="!text-gray-700"><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="!text-blue-600 hover:!text-blue-800">Google Chrome</a></li>
            <li className="!text-gray-700"><a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer" className="!text-blue-600 hover:!text-blue-800">Mozilla Firefox</a></li>
            <li className="!text-gray-700"><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="!text-blue-600 hover:!text-blue-800">Apple Safari</a></li>
            <li className="!text-gray-700"><a href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="!text-blue-600 hover:!text-blue-800">Microsoft Edge</a></li>
          </ul>
          <p className="!text-gray-700">
            <strong className="!text-gray-900">Warning:</strong> If you block cookies (especially strictly necessary ones), various parts of our site may not function properly, including our AI content generation tools and account management features.
          </p>

          <h2 id="third-party-services" className="!text-gray-900">Third-Party Services and Data Processing</h2>
          <p className="!text-gray-700">
            Our platform integrates with various third-party services to provide you with the best content creation experience:
          </p>
          <ul>
            <li className="!text-gray-700"><strong className="!text-gray-900">Social Media APIs:</strong> We connect with X (Twitter), Instagram, LinkedIn, and Facebook APIs to publish your AI-generated content directly to these platforms.</li>
            <li className="!text-gray-700"><strong className="!text-gray-900">AI Processing Services:</strong> Your content requests are processed through secure AI systems to generate viral-ready content.</li>
            <li className="!text-gray-700"><strong className="!text-gray-900">Analytics Platforms:</strong> We use analytics to understand how users interact with our content generation tools and optimize the platform.</li>
          </ul>

          <h2 id="policy-updates" className="!text-gray-900">Changes to the Cookie Policy</h2>
          <p className="!text-gray-700">
            We may update this policy periodically to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Therefore, please visit this page regularly to stay informed about how we use cookies.
          </p>

          <h2 id="contact" className="!text-gray-900">Contact Us</h2>
          <p className="!text-gray-700">
            If you have questions about the use of cookies on our platform, you can contact us at: <a href="mailto:contact@creators-multiverse.com" className="!text-blue-600 hover:!text-blue-800">contact@creators-multiverse.com</a>.
          </p>
          <p className="!text-gray-700">
            For more information about our AI-powered content generation platform, visit us at <a href="https://creators-multiverse.com" target="_blank" rel="noopener noreferrer" className="!text-blue-600 hover:!text-blue-800">creators-multiverse.com</a>.
          </p>
        </article>
      </div>
    </div>
  );
}