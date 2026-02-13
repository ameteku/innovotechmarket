import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Star, ShoppingCart, Minus, Plus, Package, Truck, Shield } from 'lucide-react';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import ProductCard from '@/components/store/ProductCard';
import { products, bundleProducts, formatPrice, type Product } from '@/data/products';
import { useCart } from '@/contexts/CartContext';

const allProducts = [...products, ...bundleProducts];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const product = allProducts.find(p => p.id === Number(id));

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Product Not Found</h2>
          <button onClick={() => navigate('/')} className="text-primary hover:underline">← Back to Store</button>
        </div>
        <Footer />
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const related = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Images */}
          <div>
            <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-3">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === i ? 'border-primary' : 'border-border'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-3">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(product.rating) ? 'fill-primary text-primary' : 'text-border'}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{product.rating} ({product.reviews} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-foreground">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                  <span className="bg-deal-flash text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">-{discount}%</span>
                </>
              )}
            </div>

            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{product.description}</p>

            {/* Bundle items */}
            {product.bundleItems && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-secondary mb-2">📦 This bundle includes:</p>
                <ul className="space-y-1">
                  {product.bundleItems.map(item => (
                    <li key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-secondary rounded-full" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-border rounded-lg">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-muted transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 font-medium text-sm border-x border-border">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="px-3 py-2 hover:bg-muted transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Free delivery above GH₵500' },
                { icon: Shield, label: 'Quality guaranteed' },
                { icon: Package, label: 'Easy returns' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center text-center p-3 bg-muted/50 rounded-lg">
                  <Icon className="h-5 w-5 text-secondary mb-1" />
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mb-10">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {related.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
