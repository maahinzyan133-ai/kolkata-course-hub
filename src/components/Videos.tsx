import { useState, useEffect } from "react";
import { Play, Clock, BookOpen, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  course_id: string | null;
  center_id: string | null;
  courses?: { name: string } | null;
  centers?: { name: string } | null;
}

const Videos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from("videos")
        .select(`
          *,
          courses(name),
          centers(name)
        `)
        .eq("is_public", true)
        .order("order_index");

      if (!error && data) {
        setVideos(data);
      }
      setIsLoading(false);
    };
    fetchVideos();
  }, []);

  if (isLoading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center">Loading videos...</div>
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return null; // Don't show section if no videos
  }

  return (
    <section id="videos" className="py-20 bg-gradient-to-br from-muted/50 via-background to-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 gradient-primary text-primary-foreground">
            <Play className="w-4 h-4 mr-2" />
            Learning Videos
          </Badge>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Watch & Learn
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our collection of educational videos to get a glimpse of what you'll learn at our centers.
          </p>
        </div>

        {/* Video Modal */}
        {selectedVideo && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setSelectedVideo(null)}
          >
            <div 
              className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={selectedVideo.video_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button 
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white transition-colors"
                onClick={() => setSelectedVideo(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card 
              key={video.id}
              className="group overflow-hidden cursor-pointer hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
              onClick={() => setSelectedVideo(video)}
            >
              <div className="relative aspect-video bg-muted">
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                    <Play className="w-16 h-16 text-primary/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-8 h-8 text-primary fill-primary" />
                  </div>
                </div>
                {video.duration_minutes && (
                  <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                    <Clock className="w-3 h-3 mr-1" />
                    {video.duration_minutes} min
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-heading font-semibold text-foreground mb-2 line-clamp-2">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {video.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {video.courses?.name && (
                    <Badge variant="outline" className="text-xs">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {video.courses.name}
                    </Badge>
                  )}
                  {video.centers?.name && (
                    <Badge variant="secondary" className="text-xs">
                      <MapPin className="w-3 h-3 mr-1" />
                      {video.centers.name}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Videos;
