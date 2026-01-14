import { useState } from "react";
import { Menu, X, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Courses", href: "#courses" },
    { name: "About", href: "#about" },
    { name: "Achievements", href: "#achievements" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md shadow-card">
      {/* Top bar */}
      <div className="gradient-primary">
        <div className="container py-2 flex flex-wrap justify-center md:justify-between items-center gap-2 text-primary-foreground text-sm">
          <div className="flex items-center gap-4">
            <a href="tel:+919733089257" className="flex items-center gap-1 hover:text-secondary transition-colors">
              <Phone className="w-4 h-4" />
              <span>+91 9733089257</span>
            </a>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>Hatisala & Satulia, Kolkata, West Bengal</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container py-3">
        <div className="flex justify-between items-center">
          <a href="#home" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-heading font-bold text-xl">
              MC
            </div>
            <div className="hidden sm:block">
              <h1 className="font-heading font-bold text-lg text-primary leading-tight">
                Modern Computer Centre
              </h1>
              <p className="text-xs text-muted-foreground">
                National Board of Computer Education
              </p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                {link.name}
              </a>
            ))}
            <Button variant="default" size="default" className="gradient-primary">
              <a href="#booking">Book Now</a>
            </Button>
          </nav>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden pt-4 pb-2 animate-slide-up">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="py-2 px-3 font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <Button variant="default" className="gradient-primary mt-2">
                <a href="#booking" onClick={() => setIsMenuOpen(false)}>Book Now</a>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
