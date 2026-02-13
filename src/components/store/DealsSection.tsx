import CountdownTimer from './CountdownTimer';
import ProductCard from './ProductCard';
import { type Product } from '@/data/products';

interface DealsSectionProps {
  title: string;
  subtitle: string;
  endDate: string;
  products: Product[];
  variant: 'flash' | 'monthly';
  emoji: string;
}

const DealsSection = ({ title, subtitle, endDate, products, variant, emoji }: DealsSectionProps) => {
  const borderClass = variant === 'flash' ? 'border-deal-flash' : 'border-deal-monthly';

  return (
    <section className={`container mx-auto px-4 py-10`}>
      <div className={`bg-card rounded-xl border-2 ${borderClass} overflow-hidden`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-6 border-b border-border">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              {emoji} {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            <span className="text-xs text-muted-foreground font-medium">Ends in:</span>
            <CountdownTimer endDate={endDate} variant={variant} />
          </div>
        </div>

        {/* Products grid */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {products.length > 8 && (
            <div className="text-center mt-6">
              <button className="text-primary font-medium text-sm hover:underline">
                View All {products.length} Deals →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DealsSection;
