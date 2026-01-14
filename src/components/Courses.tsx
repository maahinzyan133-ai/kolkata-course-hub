import { Clock, IndianRupee, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  name: string;
  fullName: string;
  duration: string;
  fee: number;
  popular?: boolean;
  category: string;
}

const courses: Course[] = [
  { id: "dca", name: "DCA", fullName: "Diploma in Computer Application", duration: "6 Months", fee: 4500, popular: true, category: "Diploma" },
  { id: "adca", name: "ADCA", fullName: "Advanced Diploma in Computer Application", duration: "1 Year", fee: 8000, popular: true, category: "Diploma" },
  { id: "pgdca", name: "PGDCA", fullName: "Post Graduate Diploma in Computer Application", duration: "1 Year", fee: 12000, category: "Diploma" },
  { id: "dit", name: "DIT", fullName: "Diploma in Information Technology", duration: "6 Months", fee: 5000, category: "Diploma" },
  { id: "adit", name: "ADIT", fullName: "Advanced Diploma in Information Technology", duration: "1 Year", fee: 9000, category: "Diploma" },
  { id: "cca", name: "CCA", fullName: "Certificate in Computer Application", duration: "3 Months", fee: 2500, category: "Certificate" },
  { id: "dtp", name: "DTP", fullName: "Desktop Publishing", duration: "3 Months", fee: 3000, category: "Multimedia" },
  { id: "dfa", name: "DFA", fullName: "Diploma in Financial Accounting", duration: "6 Months", fee: 5500, category: "Accounting" },
  { id: "tally", name: "Tally with GST", fullName: "Tally Prime with GST", duration: "3 Months", fee: 4000, popular: true, category: "Accounting" },
  { id: "python", name: "Python", fullName: "Python Programming", duration: "6 Months", fee: 6000, popular: true, category: "Programming" },
  { id: "c-cpp", name: "C, C++", fullName: "C & C++ Programming", duration: "6 Months", fee: 5500, category: "Programming" },
  { id: "hardware", name: "Hardware", fullName: "Computer Hardware & Networking", duration: "6 Months", fee: 7000, category: "Technical" },
  { id: "spoken-english", name: "Spoken English", fullName: "Spoken English Course", duration: "6 Months", fee: 3500, category: "Language" },
  { id: "ai", name: "AI Application", fullName: "AI Application & ChatGPT", duration: "3 Months", fee: 5000, popular: true, category: "Technology" },
];

interface CoursesProps {
  onBookCourse: (course: Course) => void;
}

const Courses = ({ onBookCourse }: CoursesProps) => {
  return (
    <section id="courses" className="py-20 bg-muted/50">
      <div className="container">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 gradient-gold text-secondary-foreground">
            Our Programs
          </Badge>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Professional Computer Courses
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose from our wide range of industry-recognized courses designed to help you 
            build a successful career in computer technology.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <Card 
              key={course.id} 
              className="group bg-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-xs">
                    {course.category}
                  </Badge>
                  {course.popular && (
                    <Badge className="gradient-gold text-secondary-foreground text-xs">
                      Popular
                    </Badge>
                  )}
                </div>
                <h3 className="font-heading text-xl font-bold text-primary group-hover:text-accent transition-colors">
                  {course.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.fullName}
                </p>
              </CardHeader>

              <CardContent className="pb-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-success">
                    <IndianRupee className="w-4 h-4" />
                    <span>{course.fee.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button 
                  className="w-full gradient-primary group-hover:shadow-glow transition-all"
                  onClick={() => onBookCourse(course)}
                >
                  Book Now <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? Contact us for customized courses.
          </p>
          <Button variant="outline" size="lg">
            <a href="#contact" className="flex items-center gap-2">
              Contact for Custom Courses <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export type { Course };
export { courses };
export default Courses;
