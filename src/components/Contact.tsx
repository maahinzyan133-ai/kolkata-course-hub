import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const Contact = () => {
  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      value: "+91 9733089257",
      link: "tel:+919733089257",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: "+91 9733089257",
      link: "https://wa.me/919733089257?text=Hi, I'm interested in your computer courses.",
    },
    {
      icon: Mail,
      title: "Email",
      value: "moderncomputer.centre@gmail.com",
      link: "mailto:moderncomputer.centre@gmail.com",
    },
    {
      icon: Clock,
      title: "Working Hours",
      value: "Mon - Sat: 9 AM - 8 PM",
      link: null,
    },
  ];

  return (
    <section id="contact" className="py-20 bg-muted/50">
      <div className="container">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 gradient-primary text-primary-foreground">
            Get In Touch
          </Badge>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Contact Us
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ready to start your career in computer technology? Contact us today for 
            admission inquiries or visit our centres.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {contactInfo.map((info) => (
              <Card key={info.title} className="group hover:shadow-elevated transition-all">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <info.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">
                    {info.title}
                  </h3>
                  {info.link ? (
                    <a 
                      href={info.link}
                      className="text-primary hover:text-accent transition-colors break-all"
                      target={info.link.startsWith("http") ? "_blank" : undefined}
                      rel={info.link.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {info.value}
                    </a>
                  ) : (
                    <p className="text-muted-foreground">{info.value}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Locations */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="gradient-primary p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-primary-foreground" />
                    <h3 className="font-heading font-semibold text-primary-foreground text-lg">
                      Our Centres
                    </h3>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="font-heading font-semibold text-foreground mb-2">
                      Hatisala Centre
                    </h4>
                    <p className="text-muted-foreground text-sm mb-3">
                      Near Hatisala School Math, Hatisala, Kolkata, West Bengal, India
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href="https://maps.google.com/?q=Hatisala,Kolkata,West+Bengal,India" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Get Directions
                      </a>
                    </Button>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-heading font-semibold text-foreground mb-2">
                      Satulia Centre
                    </h4>
                    <p className="text-muted-foreground text-sm mb-3">
                      Satulia, Near Main Road, Kolkata, West Bengal, India
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href="https://maps.google.com/?q=Satulia,Kolkata,West+Bengal,India" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Get Directions
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="gradient-gold">
              <CardContent className="p-6 text-center">
                <h3 className="font-heading font-bold text-xl text-secondary-foreground mb-2">
                  Admissions Open!
                </h3>
                <p className="text-secondary-foreground/80 mb-4">
                  Limited seats available. Enroll now for upcoming batches.
                </p>
                <Button 
                  size="lg" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  asChild
                >
                  <a href="#booking">Book Your Seat Now</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
