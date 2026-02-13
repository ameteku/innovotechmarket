import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal, X } from 'lucide-react';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import ProductCard from '@/components/store/ProductCard';
import { products, categories } from '@/data/products';

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'All');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 25000]);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = products;

    // Search query
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    // Category
    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Price range
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort
    switch (sortBy) {
      case 'price-asc': result = [...result].sort((a, b) => a.price - b.price); break;
      case 'price-desc': result = [...result].sort((a, b) => b.price - a.price); break;
      case 'rating': result = [...result].sort((a, b) => b.rating - a.rating); break;
      case 'newest': result = [...result].sort((a, b) => b.id - a.id); break;
    }

    return result;
  }, [query, selectedCategory, sortBy, priceRange]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Store
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
              {query ? `Results for "${query}"` : selectedCategory !== 'All' ? selectedCategory : 'All Products'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} products found</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters */}
          <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-card p-6 overflow-y-auto' : 'hidden'} lg:block lg:static lg:w-56 shrink-0`}>
            {showFilters && (
              <button onClick={() => setShowFilters(false)} className="lg:hidden mb-4 flex items-center gap-1 text-sm text-muted-foreground">
                <X className="h-4 w-4" /> Close Filters
              </button>
            )}

            {/* Category filter */}
            <div className="mb-6">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Category</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`block w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${selectedCategory === 'All' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  All ({products.length})
                </button>
                {categories.map(cat => {
                  const count = products.filter(p => p.category === cat.name).length;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`block w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${selectedCategory === cat.name ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price filter */}
            <div className="mb-6">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Price Range</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                  placeholder="Min"
                  className="w-full bg-muted border border-border rounded px-2 py-1.5 text-sm text-foreground"
                />
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                  placeholder="Max"
                  className="w-full bg-muted border border-border rounded px-2 py-1.5 text-sm text-foreground"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Sort By</h3>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="w-full bg-muted border border-border rounded px-2 py-1.5 text-sm text-foreground"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {showFilters && (
              <button
                onClick={() => setShowFilters(false)}
                className="mt-6 w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-lg lg:hidden"
              >
                Apply Filters ({filtered.length} results)
              </button>
            )}
          </aside>

          {/* Results grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg font-medium text-foreground mb-2">No products found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filtered.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchResults;
