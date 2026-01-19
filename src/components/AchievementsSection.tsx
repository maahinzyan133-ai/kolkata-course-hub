import { useState, useEffect } from "react";
import { Award, Trophy, Star, Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

// Import local achievement images as fallbacks
import achievement1 from "@/assets/achievement-1.jpg";
import achievement2 from "@/assets/achievement-2.jpg";
import achievement3 from "@/assets/achievement-3.jpg";
import achievement4 from "@/assets/achievement-4.jpg";

interface Achievement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  student_name: string | null;
  course_name: string | null;
  center_id: string | null;
  achievement_date: string | null;
  is_featured: boolean | null;
  centers?: { name: string } | null;
}

const defaultAwards = [
  { icon: Trophy, title: "NBCE Top 10 Award", year: "2024" },
  { icon: Award, title: "Best District Award - West Bengal", year: "2024" },
  { icon: Star, title: "Ratna Centre Award", year: "2024" },
  { icon: Award, title: "Monsoon Achievement Award", year: "2024" },
];

const defaultImages = [
  { src: achievement1, alt: "NBCE Top 10 Award Ceremony" },
  { src: achievement2, alt: "West Bengal Best Districts 3rd Position Award" },
  { src: achievement3, alt: "NBCE Monsoon Achievement Certificate" },
  { src: achievement4, alt: "Ratna Centre Award" },
];

const AchievementsSection = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select(`
          *,
          centers(name)
        `)
        .order("is_featured", { ascending: false })
        .order("achievement_date", { ascending: false });

      if (!error && data) {
        setAchievements(data);
      }
      setIsLoading(false);
    };
    fetchAchievements();
  }, []);

  const featuredAchievements = achievements.filter(a => a.is_featured);
  const regularAchievements = achievements.filter(a => !a.is_featured);

  // Use database achievements if available, otherwise use defaults
  const showDatabaseAchievements = achievements.length > 0;

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

        {/* Award badges - show defaults if no database achievements */}
        {!showDatabaseAchievements && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {defaultAwards.map((award) => (
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
        )}

        {/* Featured Achievements from Database */}
        {showDatabaseAchievements && featuredAchievements.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {featuredAchievements.map((achievement) => (
              <div 
                key={achievement.id}
                className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Trophy className="w-10 h-10 text-secondary mx-auto mb-3" />
                <h4 className="font-heading font-semibold text-primary-foreground mb-1">
                  {achievement.title}
                </h4>
                {achievement.student_name && (
                  <p className="text-sm text-secondary mb-1">{achievement.student_name}</p>
                )}
                <div className="flex items-center justify-center gap-2 text-xs text-primary-foreground/70">
                  {achievement.achievement_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(achievement.achievement_date).getFullYear()}
                    </span>
                  )}
                  {achievement.centers?.name && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {achievement.centers.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image gallery - use database or defaults */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {showDatabaseAchievements ? (
            achievements.slice(0, 8).map((achievement) => (
              <div 
                key={achievement.id}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-elevated"
              >
                {achievement.image_url ? (
                  <img
                    src={achievement.image_url}
                    alt={achievement.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-primary/30 flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-primary-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div>
                    <p className="text-primary-foreground text-sm font-medium">
                      {achievement.title}
                    </p>
                    {achievement.student_name && (
                      <p className="text-secondary text-xs">{achievement.student_name}</p>
                    )}
                    {achievement.centers?.name && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {achievement.centers.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            defaultImages.map((image, index) => (
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
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default AchievementsSection;
