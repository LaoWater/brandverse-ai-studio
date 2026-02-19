import { Star } from "lucide-react";

const ReviewsSection = () => {
  // Using the latest review data and adding logo filenames
  const reviews = [
    {
      name: "Alexandru Suciaghi",
      role: "Founder & CEO",
      company: "Terapie-Acasa",
      website: "https://terapie-acasa.ro",
      logo: "terapieacasa.jpg", // Logo for Terapie-Acasa
      review: "This platform transformed our content creation process completely. We went from spending hours & hours weekly on social media to just 30 minutes. Fascinated how well this tool binds with our company's brand and presence.",
      rating: 5,
      savings: "$1,200/month in Marketing Costs"
    },
    {
      name: "Lao W.",
      role: "Solo Content Creator",
      company: "Re-Connect",
      website: "https://www.facebook.com/Reconnect.Course",
      logo: "reconnect.png", // Logo for Re-Connect
      review: "As a fitness influencer/course Creator, Marketing consistency was my biggest challenge. And to be honest, i don't like. I hate it. But with this AI, it takes me 5 minutes to generate Full content for all my platforms.",
      rating: 5,
      savings: "12 hours/week saved on composing posts, designing graphics, and scheduling"
    },
    {
      name: "Danielle Woe",
      role: "Creative Director",
      company: "Bloom Wellness",
      website: null, // No website for this review
      logo: null, // No logo, will show initial
      review: "The cosmic-themed interface isn't just beautiful—it's intuitive. Our team loves how the AI captures our wellness brand's essence and adapts it perfectly for each platform.",
      rating: 5,
      savings: "20+ hours/week saved"
    }
  ];

  return (
    <section className="py-10 sm:py-16 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Creators Love Our <span className="text-cosmic font-serif">Multiverse</span>
          </h2>
          <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto px-2">
            Join thousands of creators who've transformed their content strategy with AI
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 sm:gap-8 max-w-6xl mx-auto">
          {reviews.map((review, index) => {
            // Determine if the avatar should be a link or a div
            const AvatarWrapper = review.website ? 'a' : 'div';
            const wrapperProps = review.website ? {
                href: review.website,
                target: '_blank',
                rel: 'noopener noreferrer'
            } : {};

            return (
              <div
                key={index}
                className="cosmic-card p-4 sm:p-6 relative overflow-hidden group hover:scale-105 transition-all duration-300"
              >
                {/* Cosmic glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  {/* Stars */}
                  <div className="flex items-center mb-3 sm:mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-accent fill-accent" />
                    ))}
                  </div>

                  {/* Review text */}
                  <p className="text-gray-300 mb-4 sm:mb-6 italic leading-relaxed text-sm sm:text-base">
                    "{review.review}"
                  </p>

                  {/* Savings highlight */}
                  <div className="bg-gradient-to-r from-green-500/20 to-accent/20 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 border border-green-500/30">
                    <div className="text-center">
                      <div className="text-green-400 font-bold text-sm sm:text-lg">{review.savings}</div>
                      <div className="text-green-300 text-xs sm:text-sm">Time & Cost Savings</div>
                    </div>
                  </div>
                  
                  {/* Author info */}
                  <div className="flex items-center">
                    {/* --- MODIFIED PART: CLICKABLE LOGO/INITIAL --- */}
                    <AvatarWrapper 
                      {...wrapperProps}
                      className="w-12 h-12 rounded-full mr-3 flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary to-accent"
                    >
                      {review.logo ? (
                        <img
                          src={`/${review.logo}`}
                          alt={`${review.company} logo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                          {review.name.charAt(0)}
                        </div>
                      )}
                    </AvatarWrapper>
                    {/* --- END MODIFIED PART --- */}
                    
                    <div>
                      <div className="text-white font-semibold">{review.name}</div>
                      <div className="text-gray-400 text-sm">{review.role}</div>
                      {review.website ? (
                        <a
                          href={review.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent text-sm transition-all duration-300 hover:underline hover:brightness-125"
                        >
                          {review.company}
                        </a>
                      ) : (
                        <div className="text-accent text-sm">{review.company}</div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Subtle animation elements */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-accent rounded-full animate-pulse opacity-60"></div>
                <div className="absolute bottom-4 left-4 w-1 h-1 bg-primary rounded-full animate-ping opacity-40"></div>
              </div>
            );
          })}
        </div>
        
        {/* Trust indicators */}
        <div className="text-center mt-8 sm:mt-12 opacity-80">
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-0 sm:space-x-8 text-gray-400">
            <div className="text-center px-4">
              <div className="text-xl sm:text-2xl font-bold text-accent">1,000+</div>
              <div className="text-xs sm:text-sm">Active Creators</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gray-600"></div>
            <div className="text-center px-4">
              <div className="text-xl sm:text-2xl font-bold text-accent">300K+</div>
              <div className="text-xs sm:text-sm">Posts Generated</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gray-600"></div>
            <div className="text-center px-4">
              <div className="text-xl sm:text-2xl font-bold text-accent">10K+</div>
              <div className="text-xs sm:text-sm">Hours Saved Monthly</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;