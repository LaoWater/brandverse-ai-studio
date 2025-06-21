
import { Star } from "lucide-react";

const ReviewsSection = () => {
  const reviews = [
    {
      name: "Sarah Martinez",
      role: "Digital Marketing Manager",
      company: "TechFlow Studios",
      review: "This platform transformed our content creation process completely. We went from spending 8 hours weekly on social media to just 30 minutes. The AI understands our brand voice perfectly!",
      rating: 5,
      savings: "7.5 hours/week saved"
    },
    {
      name: "Marcus Chen",
      role: "Solo Content Creator",
      company: "FitnessForward",
      review: "As a fitness influencer, consistency was my biggest challenge. Now I can maintain my posting schedule across all platforms effortlessly. My engagement rates have increased by 300%!",
      rating: 5,
      savings: "$2,400/month in time value"
    },
    {
      name: "Elena Rodriguez",
      role: "Creative Director",
      company: "Bloom Wellness",
      review: "The cosmic-themed interface isn't just beautiful—it's intuitive. Our team loves how the AI captures our wellness brand's essence and adapts it perfectly for each platform.",
      rating: 5,
      savings: "12 hours/week saved"
    }
  ];

  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Creators Love Our <span className="text-cosmic font-serif">Multiverse</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Join thousands of creators who've transformed their content strategy with AI
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {reviews.map((review, index) => (
            <div 
              key={index}
              className="cosmic-card p-6 relative overflow-hidden group hover:scale-105 transition-all duration-300"
            >
              {/* Cosmic glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                {/* Stars */}
                <div className="flex items-center mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-accent fill-accent" />
                  ))}
                </div>
                
                {/* Review text */}
                <p className="text-gray-300 mb-6 italic leading-relaxed">
                  "{review.review}"
                </p>
                
                {/* Savings highlight */}
                <div className="bg-gradient-to-r from-green-500/20 to-accent/20 rounded-lg p-3 mb-4 border border-green-500/30">
                  <div className="text-center">
                    <div className="text-green-400 font-bold text-lg">{review.savings}</div>
                    <div className="text-green-300 text-sm">Time & Cost Savings</div>
                  </div>
                </div>
                
                {/* Author info */}
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{review.name}</div>
                    <div className="text-gray-400 text-sm">{review.role}</div>
                    <div className="text-accent text-sm">{review.company}</div>
                  </div>
                </div>
              </div>
              
              {/* Subtle animation elements */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-accent rounded-full animate-pulse opacity-60"></div>
              <div className="absolute bottom-4 left-4 w-1 h-1 bg-primary rounded-full animate-ping opacity-40"></div>
            </div>
          ))}
        </div>
        
        {/* Trust indicators */}
        <div className="text-center mt-12 opacity-80">
          <div className="flex justify-center items-center space-x-8 text-gray-400">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">10,000+</div>
              <div className="text-sm">Active Creators</div>
            </div>
            <div className="w-px h-12 bg-gray-600"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">2M+</div>
              <div className="text-sm">Posts Generated</div>
            </div>
            <div className="w-px h-12 bg-gray-600"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">50K+</div>
              <div className="text-sm">Hours Saved Monthly</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
