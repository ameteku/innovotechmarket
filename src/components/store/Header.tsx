import { Search, ShoppingCart, Menu, User, X } from 'lucide-react';
import { useState } from 'react';
import { categories } from '@/data/products';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card shadow-sm">
      {/* Top promo bar */}
      <div className="bg-primary text-primary-foreground text-xs py-1.5 text-center font-medium tracking-wide">
        🇬🇭 Free delivery on orders above GH₵500 • Serving all regions in Ghana
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        <button className="lg:hidden text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <h1 className="text-xl sm:text-2xl font-heading font-bold text-primary whitespace-nowrap">
          Ghana<span className="text-secondary">Market</span>
        </h1>

        <div className="flex-1 hidden md:flex items-center bg-muted rounded-lg px-3">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search 200+ products..."
            className="bg-transparent w-full py-2 px-2 outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-md whitespace-nowrap">
            Search
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <User className="h-5 w-5 text-foreground" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors relative">
            <ShoppingCart className="h-5 w-5 text-foreground" />
            <span className="absolute -top-0.5 -right-0.5 bg-deal-flash text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              0
            </span>
          </button>
        </div>
      </div>

      {/* Desktop categories */}
      <nav className="hidden lg:block border-t border-border bg-card">
        <div className="container mx-auto px-4 flex gap-6 py-2">
          {categories.map(cat => (
            <button key={cat.name} className="text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap font-medium">
              {cat.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-border bg-card animate-fade-up">
          <div className="p-4 space-y-1">
            <div className="flex items-center bg-muted rounded-lg px-3 mb-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                className="bg-transparent w-full py-2 px-2 outline-none text-sm text-foreground"
              />
            </div>
            {categories.map(cat => (
              <button key={cat.name} className="block w-full text-left py-2.5 px-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors">
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
