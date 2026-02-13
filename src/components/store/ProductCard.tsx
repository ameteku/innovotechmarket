import { useState } from 'react';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import { type Product, formatPrice } from '@/data/products';

interface ProductCardProps {
  product: Product;
}

const badgeStyles: Record<string, string> = {
  'flash-deal': 'bg-deal-flash text-primary-foreground',
  '30-day-deal': 'bg-deal-monthly text-primary-foreground',
  'bundle': 'bg-bundle text-secondary-foreground',
  'new': 'bg-primary text-primary-foreground',
  'bestseller': 'bg-accent text-accent-foreground',
};

const badgeLabels: Record<string, string> = {
  'flash-deal': '⚡ Flash Deal',
  '30-day-deal': '🔥 Monthly Deal',
  'bundle': '📦 Bundle',
  'new': '✨ New',
  'bestseller': '🏆 Bestseller',
};

const ProductCard = ({ product }: ProductCardProps) => {
  const [imgIndex, setImgIndex] = useState(0);
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Image */}
      <div
        className="relative aspect-square bg-muted overflow-hidden"
        onMouseEnter={() => setImgIndex(1)}
        onMouseLeave={() => setImgIndex(0)}
      >
        <img
          src={product.images[imgIndex]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {product.badge && (
          <span className={`absolute top-2 left-2 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${badgeStyles[product.badge]}`}>
            {badgeLabels[product.badge]}
          </span>
        )}
        {discount > 0 && (
          <span className="absolute top-2 right-2 bg-deal-flash text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded">
            -{discount}%
          </span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
            <span className="bg-card text-foreground text-sm font-semibold px-3 py-1 rounded">Out of Stock</span>
          </div>
        )}
        <button className="absolute bottom-2 right-2 bg-card/90 backdrop-blur p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow">
          <Eye className="h-4 w-4 text-foreground" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
        <h3 className="font-medium text-sm text-card-foreground line-clamp-2 mb-2 flex-1">{product.name}</h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map(s => (
              <Star
                key={s}
                className={`h-3 w-3 ${s <= Math.round(product.rating) ? 'fill-primary text-primary' : 'text-border'}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-card-foreground">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        {/* Bundle items */}
        {product.bundleItems && (
          <div className="mb-3 text-xs text-muted-foreground">
            <span className="font-medium text-bundle">Includes:</span>{' '}
            {product.bundleItems.join(', ')}
          </div>
        )}

        <button
          disabled={!product.inStock}
          className="w-full bg-primary text-primary-foreground text-sm font-medium py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5 mt-auto"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
