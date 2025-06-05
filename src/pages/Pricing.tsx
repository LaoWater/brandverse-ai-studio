
import Navigation from "@/components/Navigation";
import { Check, Sparkles, Crown, Zap } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      icon: <Sparkles className="w-6 h-6" />,
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with AI content creation",
      features: [
        "50 AI generations per day",
        "3 brand voice profiles",
        "Basic content templates",
        "Standard support",
        "Export to major platforms"
      ],
      buttonText: "Get Started Free",
      buttonClass: "cosmic-button",
      popular: false
    },
    {
      name: "Standard",
      icon: <Crown className="w-6 h-6" />,
      price: "$29",
      period: "per month",
      description: "Ideal for growing creators and small businesses",
      features: [
        "500 AI generations per day",
        "10 brand voice profiles",
        "Advanced content templates",
        "Priority support",
        "Campaign management",
        "Analytics dashboard",
        "Custom content scheduling"
      ],
      buttonText: "Upgrade to Standard",
      buttonClass: "cosmic-button",
      popular: true
    },
    {
      name: "Pro",
      icon: <Zap className="w-6 h-6" />,
      price: "$79",
      period: "per month",
      description: "For agencies and high-volume content creators",
      features: [
        "Unlimited AI generations",
        "Unlimited brand voice profiles",
        "Premium content templates",
        "24/7 priority support",
        "Advanced campaign management",
        "Detailed analytics & insights",
        "API access",
        "White-label options",
        "Team collaboration tools"
      ],
      buttonText: "Go Pro",
      buttonClass: "cosmic-button",
      popular: false
    }
  ];

  const payAsYouGo = {
    title: "Pay-As-You-Go",
    description: "Flexible pricing for occasional users",
    price: "$0.10",
    unit: "per generation",
    features: [
      "No monthly commitment",
      "Pay only for what you use",
      "All premium features included",
      "Perfect for testing at scale"
    ]
  };

  return (
    <div className="min-h-screen bg-cosmic-gradient">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Simple, Transparent
              <span className="text-cosmic block mt-2">Pricing</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Choose the perfect plan for your content creation needs. Start free and scale as you grow.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`cosmic-card p-8 relative ${plan.popular ? 'ring-2 ring-accent' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-accent text-black px-6 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    {plan.icon}
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 ml-2">{plan.period}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`${plan.buttonClass} w-full py-3 rounded-lg font-semibold`}>
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>

          {/* Pay-As-You-Go Section */}
          <div className="cosmic-card p-8 text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">{payAsYouGo.title}</h3>
            <p className="text-gray-300 mb-6">{payAsYouGo.description}</p>
            
            <div className="mb-6">
              <span className="text-3xl font-bold text-white">{payAsYouGo.price}</span>
              <span className="text-gray-400 ml-2">{payAsYouGo.unit}</span>
            </div>

            <ul className="space-y-2 mb-8 max-w-md mx-auto">
              {payAsYouGo.features.map((feature, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button className="cosmic-button px-8 py-3 rounded-lg font-semibold">
              Start Pay-As-You-Go
            </button>
          </div>

          {/* FAQ Section */}
          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="text-left">
                <h4 className="text-lg font-semibold text-white mb-2">Can I change plans anytime?</h4>
                <p className="text-gray-300">Yes, you can upgrade, downgrade, or cancel your subscription at any time. Changes take effect immediately.</p>
              </div>
              <div className="text-left">
                <h4 className="text-lg font-semibold text-white mb-2">What happens to unused generations?</h4>
                <p className="text-gray-300">Unused daily generations don't roll over, but you can always upgrade for higher limits or use pay-as-you-go for flexibility.</p>
              </div>
              <div className="text-left">
                <h4 className="text-lg font-semibold text-white mb-2">Do you offer refunds?</h4>
                <p className="text-gray-300">Yes, we offer a 30-day money-back guarantee for all paid plans. No questions asked.</p>
              </div>
              <div className="text-left">
                <h4 className="text-lg font-semibold text-white mb-2">Is there a free trial for paid plans?</h4>
                <p className="text-gray-300">Our generous free plan lets you experience most features. You can also try any paid plan for 7 days risk-free.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
