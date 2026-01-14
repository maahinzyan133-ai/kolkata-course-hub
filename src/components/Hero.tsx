import { ArrowRight, Award, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";
import awardImage from "@/assets/achievement-1.jpg";

const Hero = () => {
  const stats = [
    { icon: Users, value: "5000+", label: "Students Trained" },
    { icon: Award, value: "15+", label: "Years Experience" },
    { icon: BookOpen, value: "25+", label: "Courses Offered" },
  ];

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-32 pb-16">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Modern Computer Centre classroom"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 gradient-hero"></div>
      </div>

      {/* Content */}
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-secondary/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
              <Award className="w-5 h-5 text-secondary" />
              <span className="text-secondary font-medium">NBCE Certified Institute</span>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-slide-up">
              Build Your Career in
              <span className="block text-secondary mt-2">Computer Technology</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Join Modern Computer Centre - an award-winning computer training school offering 
              industry-recognized courses with 100% job placement assistance.
            </p>

            <div className="flex flex-wrap gap-4 mb-12 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button size="lg" className="gradient-gold text-secondary-foreground font-semibold shadow-elevated hover:scale-105 transition-transform">
                <a href="#courses" className="flex items-center gap-2">
                  Explore Courses <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm">
                <a href="#contact">Contact Us</a>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              {stats.map((stat) => (
                <div key={stat.label} className="text-center md:text-left">
                  <div className="flex justify-center md:justify-start mb-2">
                    <stat.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <p className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground">
                    {stat.value}
                  </p>
                  <p className="text-sm text-primary-foreground/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right content - Award Image */}
          <div className="hidden lg:block animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <div className="relative">
              <div className="absolute -inset-4 gradient-gold rounded-2xl opacity-20 blur-xl"></div>
              <div className="relative rounded-2xl overflow-hidden shadow-elevated border-4 border-secondary/30">
                <img
                  src={awardImage}
                  alt="NBCE Top 10 Award Ceremony"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/90 to-transparent p-4">
                  <p className="text-primary-foreground font-heading font-semibold text-center">
                    🏆 NBCE Top 10 Award Ceremony
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-primary-foreground/50 rounded-full animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
