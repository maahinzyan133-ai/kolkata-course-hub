import { useState } from "react";
import { X, User, Phone, Mail, BookOpen, Calendar, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Course } from "./Courses";
import { courses } from "./Courses";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCourse?: Course | null;
}

const BookingModal = ({ isOpen, onClose, selectedCourse }: BookingModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    course: selectedCourse?.id || "",
    preferredTime: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const selectedCourseData = courses.find((c) => c.id === formData.course);
    
    toast({
      title: "🎉 Admission Request Submitted!",
      description: `Thank you ${formData.name}! Your request for ${selectedCourseData?.name || "the course"} has been received. We will contact you shortly at ${formData.phone}.`,
    });

    setIsSubmitting(false);
    setFormData({ name: "", phone: "", email: "", course: "", preferredTime: "" });
    onClose();
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedCourseInfo = courses.find((c) => c.id === (formData.course || selectedCourse?.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-elevated w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="gradient-primary p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
          >
            <X className="w-5 h-5 text-primary-foreground" />
          </button>
          <h2 className="font-heading text-2xl font-bold text-primary-foreground">
            Book Your Course
          </h2>
          <p className="text-primary-foreground/80 text-sm mt-1">
            Fill in your details to enroll
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Full Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="Enter your phone number"
              pattern="[0-9]{10}"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Enter your email (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              Select Course *
            </Label>
            <Select 
              value={formData.course || selectedCourse?.id} 
              onValueChange={(value) => handleChange("course", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} - {course.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Preferred Batch Timing
            </Label>
            <Select 
              value={formData.preferredTime} 
              onValueChange={(value) => handleChange("preferredTime", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select batch timing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12 PM - 4 PM)</SelectItem>
                <SelectItem value="evening">Evening (4 PM - 8 PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Course summary */}
          {selectedCourseInfo && (
            <div className="bg-muted rounded-xl p-4">
              <h4 className="font-heading font-semibold text-foreground mb-2">
                Course Summary
              </h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  <strong>Course:</strong> {selectedCourseInfo.fullName}
                </p>
                <p className="text-muted-foreground">
                  <strong>Duration:</strong> {selectedCourseInfo.duration}
                </p>
                <p className="flex items-center gap-1 text-success font-semibold">
                  <IndianRupee className="w-4 h-4" />
                  <strong>Fee:</strong> ₹{selectedCourseInfo.fee.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full gradient-gold text-secondary-foreground font-semibold py-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Admission Request"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By submitting, you agree to receive SMS/WhatsApp updates about your admission.
          </p>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
