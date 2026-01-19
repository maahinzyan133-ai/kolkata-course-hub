import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Courses from "@/components/Courses";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import AchievementsSection from "@/components/AchievementsSection";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import WhatsAppButton from "@/components/WhatsAppButton";
import EnrollmentForm from "@/components/EnrollmentForm";
import Videos from "@/components/Videos";
import type { Course } from "@/components/Courses";

const Index = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const handleBookCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsBookingOpen(true);
  };

  useEffect(() => {
    const handleBookingClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href="#booking"]');
      if (link) {
        e.preventDefault();
        setSelectedCourse(null);
        setIsBookingOpen(true);
      }
    };

    document.addEventListener("click", handleBookingClick);
    return () => document.removeEventListener("click", handleBookingClick);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <EnrollmentForm />
        <Courses onBookCourse={handleBookCourse} />
        <Videos />
        <About />
        <Testimonials />
        <AchievementsSection />
        <Contact />
      </main>
      <Footer />
      
      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        selectedCourse={selectedCourse}
      />
      
      <WhatsAppButton />
    </div>
  );
};

export default Index;
