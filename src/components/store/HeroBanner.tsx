import heroBg from '@/assets/hero-banner.jpg';

const HeroBanner = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="Ghana Market" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 py-16 sm:py-24 lg:py-32">
        <div className="max-w-lg">
          <span className="inline-block bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full mb-4 animate-fade-up">
            🇬🇭 #1 Online Store in Ghana
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-card mb-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Shop the Best Deals Across Ghana
          </h2>
          <p className="text-card/80 text-sm sm:text-base mb-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            200+ quality products with fast delivery nationwide. Enjoy flash deals, monthly specials & exclusive bundles — all in Ghana Cedis.
          </p>
          <div className="flex gap-3 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <button className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm">
              Shop Now
            </button>
            <button className="bg-card/20 backdrop-blur text-card border border-card/30 font-semibold px-6 py-3 rounded-lg hover:bg-card/30 transition-colors text-sm">
              View Deals
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
