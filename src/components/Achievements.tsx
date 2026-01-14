import { Award, Trophy, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import achievement1 from "@/assets/achievement-1.jpg";
import achievement2 from "@/assets/achievement-2.jpg";
import achievement3 from "@/assets/achievement-3.jpg";
import achievement4 from "@/assets/achievement-4.jpg";

const Achievements = () => {
  const images = [
    { src: achievement1, alt: "NBCE Top 10 Award Ceremony" },
    { src: achievement2, alt: "West Bengal Best Districts 3rd Position Award" },
    { src: achievement3, alt: "NBCE Monsoon Achievement Certificate" },
    { src: achievement4, alt: "Ratna Centre Award" },
  ];

  const awards = [
    { icon: Trophy, title: "NBCE Top 10 Award", year: "2024" },
    { icon: Award, title: "Best District Award - West Bengal", year: "2024" },
    { icon: Star, title: "Ratna Centre Award", year: "2024" },
    { icon: Award, title: "Monsoon Achievement Award", year: "2024" },
  ];

  return (
    <section id="achievements" className="py-20 gradient-primary">
      <div className="container">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 gradient-gold text-secondary-foreground">
            Our Achievements
          </Badge>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Award-Winning Excellence
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Recognized by the National Board of Computer Education for our outstanding 
            contribution to computer education in West Bengal.
          </p>
        </div>

        {/* Award badges */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {awards.map((award) => (
            <div 
              key={award.title}
              className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-primary-foreground/20 transition-colors"
            >
              <award.icon className="w-10 h-10 text-secondary mx-auto mb-3" />
              <h4 className="font-heading font-semibold text-primary-foreground mb-1">
                {award.title}
              </h4>
              <p className="text-sm text-primary-foreground/70">{award.year}</p>
            </div>
          ))}
        </div>

        {/* Image gallery */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div 
              key={index}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-elevated"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <p className="text-primary-foreground text-sm font-medium">
                  {image.alt}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Achievements;
