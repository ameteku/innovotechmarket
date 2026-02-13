import { Smartphone, Laptop, Shirt, Home, Sparkles, Zap, UtensilsCrossed, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { categories } from '@/data/products';

const iconMap: Record<string, React.ElementType> = {
  Smartphone, Laptop, Shirt, Home, Sparkles, Zap, UtensilsCrossed, Dumbbell,
};

const CategoryGrid = () => {
  const navigate = useNavigate();

  return (
    <section className="container mx-auto px-4 py-10">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Shop by Category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {categories.map((cat, i) => {
          const Icon = iconMap[cat.icon] || Zap;
          return (
            <button
              key={cat.name}
              onClick={() => navigate(`/search?category=${encodeURIComponent(cat.name)}`)}
              className="flex flex-col items-center gap-2 p-4 bg-card rounded-lg border border-border hover:border-primary hover:shadow-md transition-all duration-200 group"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `#${cat.color}15` }}
              >
                <Icon className="h-5 w-5" style={{ color: `#${cat.color}` }} />
              </div>
              <span className="text-xs font-medium text-center text-foreground leading-tight">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryGrid;
