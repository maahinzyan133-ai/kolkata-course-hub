import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  content: string;
  rating: number;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  courses: {
    name: string;
  } | null;
}

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select(`
          id,
          content,
          rating,
          profiles:user_id (full_name, avatar_url),
          courses:course_id (name)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (!error && data) {
        setTestimonials(data as unknown as Testimonial[]);
      }
      setLoading(false);
    };

    fetchTestimonials();
  }, []);

  // Show placeholder testimonials if no data
  const placeholderTestimonials = [
    {
      id: "1",
      content: "The Tally with GST course was excellent! Got placed within a month of completing.",
      rating: 5,
      profiles: { full_name: "Rahul Sharma", avatar_url: null },
      courses: { name: "Tally Prime" }
    },
    {
      id: "2", 
      content: "Python programming course helped me get my first IT job. Great teachers!",
      rating: 5,
      profiles: { full_name: "Priya Das", avatar_url: null },
      courses: { name: "Python" }
    },
    {
      id: "3",
      content: "DCA course gave me all the basic skills I needed. Now working in a software company.",
      rating: 4,
      profiles: { full_name: "Amit Kumar", avatar_url: null },
      courses: { name: "DCA" }
    }
  ];

  const displayTestimonials = testimonials.length > 0 ? testimonials : placeholderTestimonials;

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center">Loading testimonials...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 gradient-gold text-secondary-foreground">
            Student Reviews
          </Badge>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our Students Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear from our successful alumni who have built their careers with our training.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTestimonials.map((testimonial) => (
            <Card key={testimonial.id} className="group hover:shadow-elevated transition-all duration-300 bg-card">
              <CardContent className="p-6">
                <Quote className="w-10 h-10 text-primary/20 mb-4" />
                
                <p className="text-foreground mb-4 line-clamp-4">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < testimonial.rating
                          ? "text-secondary fill-secondary"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="gradient-primary text-primary-foreground">
                      {testimonial.profiles?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">
                      {testimonial.profiles?.full_name || "Student"}
                    </p>
                    {testimonial.courses && (
                      <p className="text-sm text-muted-foreground">
                        {testimonial.courses.name} Course
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
