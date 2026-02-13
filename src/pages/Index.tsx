import Header from '@/components/store/Header';
import HeroBanner from '@/components/store/HeroBanner';
import CategoryGrid from '@/components/store/CategoryGrid';
import DealsSection from '@/components/store/DealsSection';
import BundleSection from '@/components/store/BundleSection';
import FeaturedProducts from '@/components/store/FeaturedProducts';
import Footer from '@/components/store/Footer';
import { flashDeals, monthlyDeals } from '@/data/products';

const flashEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
const monthlyEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroBanner />
      <CategoryGrid />

      <DealsSection
        title="Flash Deals"
        subtitle="Hurry! These deals expire in 3 days"
        endDate={flashEnd}
        products={flashDeals}
        variant="flash"
        emoji="⚡"
      />

      <DealsSection
        title="Monthly Specials"
        subtitle="Great prices all month long"
        endDate={monthlyEnd}
        products={monthlyDeals}
        variant="monthly"
        emoji="🔥"
      />

      <BundleSection />
      <FeaturedProducts />
      <Footer />
    </div>
  );
};

export default Index;
