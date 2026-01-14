import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  const quickLinks = [
    { name: "Home", href: "#home" },
    { name: "Courses", href: "#courses" },
    { name: "About Us", href: "#about" },
    { name: "Achievements", href: "#achievements" },
    { name: "Contact", href: "#contact" },
  ];

  const courses = [
    "DCA", "ADCA", "PGDCA", "Tally with GST", "Python", "Spoken English", "AI Application"
  ];

  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-secondary-foreground font-heading font-bold text-xl">
                MC
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg">
                  Modern Computer Centre
                </h3>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-sm mb-4">
              An NBCE certified computer training institute providing quality 
              education since 2009. Your career is our priority.
            </p>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-primary-foreground/70 hover:text-secondary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Courses */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Popular Courses</h4>
            <ul className="space-y-2">
              {courses.map((course) => (
                <li key={course}>
                  <a 
                    href="#courses" 
                    className="text-primary-foreground/70 hover:text-secondary transition-colors"
                  >
                    {course}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Contact Info</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                <a 
                  href="tel:+919733089257" 
                  className="text-primary-foreground/70 hover:text-secondary transition-colors"
                >
                  +91 9733089257
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                <a 
                  href="mailto:moderncomputer.centre@gmail.com" 
                  className="text-primary-foreground/70 hover:text-secondary transition-colors break-all text-sm"
                >
                  moderncomputer.centre@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                <span className="text-primary-foreground/70 text-sm">
                  Hatisala & Satulia, Kolkata, West Bengal, India
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-primary-foreground/50">
            <p>© 2024 Modern Computer Centre. All rights reserved.</p>
            <p>Affiliated with National Board of Computer Education</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
