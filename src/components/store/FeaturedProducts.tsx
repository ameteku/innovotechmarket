import { useState } from 'react';
import ProductCard from './ProductCard';
import { products, categories } from '@/data/products';

const FeaturedProducts = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filtered = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const displayed = filtered.slice(0, 16);

  return (
    <section className="container mx-auto px-4 py-10">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-2">All Products</h2>
      <p className="text-sm text-muted-foreground mb-6">Browse our full catalog of 200+ products</p>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`text-xs font-medium px-4 py-2 rounded-full whitespace-nowrap transition-colors border ${
            selectedCategory === 'All'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-primary'
          }`}
        >
          All ({products.length})
        </button>
        {categories.map(cat => {
          const count = products.filter(p => p.category === cat.name).length;
          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`text-xs font-medium px-4 py-2 rounded-full whitespace-nowrap transition-colors border ${
                selectedCategory === cat.name
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {displayed.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filtered.length > 16 && (
        <div className="text-center mt-8">
          <button className="bg-primary text-primary-foreground font-medium px-8 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm">
            Load More Products ({filtered.length - 16} remaining)
          </button>
        </div>
      )}
    </section>
  );
};

export default FeaturedProducts;
