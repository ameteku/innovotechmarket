import ProductCard from './ProductCard';
import { bundleProducts, formatPrice } from '@/data/products';

const BundleSection = () => {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            📦 Bundle Deals
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Save more when you buy together</p>
        </div>
        <button className="text-primary font-medium text-sm hover:underline hidden sm:block">
          View All Bundles →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {bundleProducts.slice(0, 8).map(bundle => (
          <div key={bundle.id} className="relative">
            {bundle.originalPrice && (
              <div className="absolute -top-2 -right-2 z-10 bg-bundle text-secondary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                Save {formatPrice(bundle.originalPrice - bundle.price)}
              </div>
            )}
            <ProductCard product={bundle} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default BundleSection;
