import { CheckCircle, Target, Award, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const About = () => {
  const features = [
    {
      icon: Target,
      title: "Industry-Focused Training",
      description: "Curriculum designed with input from IT industry professionals to ensure job-ready skills.",
    },
    {
      icon: Award,
      title: "NBCE Certified",
      description: "Recognized by National Board of Computer Education with state and national awards.",
    },
    {
      icon: Briefcase,
      title: "100% Placement Assistance",
      description: "Dedicated placement cell to help students find jobs in top companies.",
    },
  ];

  const highlights = [
    "Experienced & certified faculty",
    "Hands-on practical training",
    "Modern computer lab facilities",
    "Flexible batch timings",
    "Affordable course fees",
    "Government recognized certificates",
    "Regular assessment & feedback",
    "Career counseling support",
  ];

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <Badge variant="secondary" className="mb-4 gradient-primary text-primary-foreground">
              About Us
            </Badge>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
              Empowering Students Since 2009
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              <strong>Modern Computer Centre</strong> is a leading computer training institute located in 
              Hatisala and Satulia, Kolkata. We are affiliated with the <strong>National Board of 
              Computer Education (NBCE)</strong> and have been recognized as one of the top computer 
              training centres in West Bengal.
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Our mission is to provide quality computer education that helps students build 
              successful careers in the IT industry. With over 15 years of experience, we have 
              trained more than 5000 students who are now working in various reputed companies.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right content - Feature cards */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="group hover:shadow-elevated transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <feature.icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
