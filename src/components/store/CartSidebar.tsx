import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/data/products';

const CartSidebar = () => {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-foreground/40 z-50" onClick={() => setIsCartOpen(false)} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card z-50 shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-heading font-bold text-lg text-card-foreground flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Cart ({totalItems})
          </h2>
          <button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingBag className="h-16 w-16 mb-4 opacity-30" />
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm mt-1">Add items to get started</p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-3 bg-muted/50 rounded-lg p-3">
                <img src={product.images[0]} alt={product.name} className="w-16 h-16 rounded-md object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground line-clamp-1">{product.name}</p>
                  <p className="text-sm font-bold text-primary mt-0.5">{formatPrice(product.price)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="w-6 h-6 rounded bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="w-6 h-6 rounded bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="ml-auto p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold text-card-foreground">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-secondary font-medium">{totalPrice >= 500 ? 'FREE' : formatPrice(30)}</span>
            </div>
            <div className="flex justify-between font-bold text-card-foreground border-t border-border pt-2">
              <span>Total</span>
              <span>{formatPrice(totalPrice + (totalPrice >= 500 ? 0 : 30))}</span>
            </div>
            <button className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity">
              Checkout — {formatPrice(totalPrice + (totalPrice >= 500 ? 0 : 30))}
            </button>
            <button onClick={clearCart} className="w-full text-sm text-muted-foreground hover:text-destructive transition-colors">
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
