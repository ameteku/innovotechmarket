import { MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-foreground text-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">
              Ghana<span className="text-primary">Market</span>
            </h3>
            <p className="text-card/70 text-sm leading-relaxed mb-4">
              Your trusted online marketplace in Ghana. Quality products, competitive prices, and fast delivery across all regions.
            </p>
            <div className="flex gap-3">
              {['Facebook', 'Twitter', 'Instagram'].map(s => (
                <button key={s} className="w-8 h-8 rounded-full bg-card/10 hover:bg-primary transition-colors flex items-center justify-center text-xs font-bold">
                  {s[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-card/70">
              {['About Us', 'Contact', 'FAQs', 'Shipping Policy', 'Returns', 'Terms & Conditions'].map(l => (
                <li key={l}><button className="hover:text-primary transition-colors">{l}</button></li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm text-card/70">
              {['Phones & Tablets', 'Laptops', 'Fashion', 'Home & Kitchen', 'Beauty', 'Electronics'].map(l => (
                <li key={l}><button className="hover:text-primary transition-colors">{l}</button></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3 text-sm text-card/70">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <span>Accra Mall, Tetteh Quarshie, Accra, Ghana</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>+233 XX XXX XXXX</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>hello@ghanamarket.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-card/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-card/50">© 2026 GhanaMarket. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-card/50">
            <span>Mobile Money</span>
            <span>Visa</span>
            <span>Mastercard</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
