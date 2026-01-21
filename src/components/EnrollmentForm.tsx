import { useState, useEffect } from "react";
import { User, Phone, Mail, BookOpen, Calendar, MapPin, IndianRupee, GraduationCap, CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  name: string;
  full_name: string;
  duration: string;
  fee: number;
  is_popular?: boolean;
  category: string;
}

interface Center {
  id: string;
  name: string;
  address: string;
  phone: string;
}

const EnrollmentForm = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    course: "",
    center: "",
    preferredTime: "",
    paymentMethod: "offline", // "offline" or "online"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [coursesRes, centersRes] = await Promise.all([
        supabase.from("courses").select("*").order("name"),
        supabase.from("centers").select("*").order("name"),
      ]);
      
      if (coursesRes.data) setCourses(coursesRes.data);
      if (centersRes.data) setCenters(centersRes.data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.course || !formData.center) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedCourse = courses.find((c) => c.id === formData.course);
      const selectedCenter = centers.find((c) => c.id === formData.center);
      
      if (formData.paymentMethod === "online") {
        // Create Stripe checkout session
        const { data, error } = await supabase.functions.invoke('create-enrollment-payment', {
          body: {
            name: formData.name,
            phone: formData.phone,
            email: formData.email || undefined,
            course_id: formData.course,
            center_id: formData.center,
            preferred_time: formData.preferredTime || undefined,
            amount: selectedCourse?.fee || 0,
            course_name: selectedCourse?.full_name || selectedCourse?.name || '',
            center_name: selectedCenter?.name || '',
          }
        });

        if (error) {
          console.error("Payment error:", error);
          toast({
            title: "Payment Error",
            description: "Failed to initiate payment. Please try again or choose offline payment.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        if (data?.url) {
          toast({
            title: "💳 Redirecting to Payment...",
            description: `You'll be redirected to complete your payment of ₹${selectedCourse?.fee?.toLocaleString()}.`,
          });
          
          // Redirect to Stripe Checkout
          window.location.href = data.url;
          return;
        }
      } else {
        // Offline payment - send WhatsApp message
        const message = `🎓 New Enrollment Request!\n\n` +
          `Name: ${formData.name}\n` +
          `Phone: ${formData.phone}\n` +
          `Email: ${formData.email || 'Not provided'}\n` +
          `Course: ${selectedCourse?.full_name}\n` +
          `Center: ${selectedCenter?.name}\n` +
          `Payment Mode: Pay at Center\n` +
          `Preferred Time: ${formData.preferredTime || 'Not specified'}`;

        const whatsappUrl = `https://wa.me/919733089257?text=${encodeURIComponent(message)}`;
        
        toast({
          title: "🎉 Enrollment Request Ready!",
          description: `Thank you ${formData.name}! Click the WhatsApp button to complete your enrollment for ${selectedCourse?.name} at ${selectedCenter?.name}.`,
        });

        window.open(whatsappUrl, '_blank');
      }

      setFormData({ name: "", phone: "", email: "", course: "", center: "", preferredTime: "", paymentMethod: "offline" });
    } catch (error) {
      console.error("Enrollment error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedCourse = courses.find((c) => c.id === formData.course);
  const selectedCenter = centers.find((c) => c.id === formData.center);

  return (
    <section id="enrollment" className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      <div className="container">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 gradient-gold text-secondary-foreground">
            <GraduationCap className="w-4 h-4 mr-2" />
            Quick Enrollment
          </Badge>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Start Your Journey Today
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Fill in your details below to enroll in your preferred course. 
            Choose your nearest center and start learning!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Form */}
          <Card className="shadow-elevated border-primary/20">
            <CardHeader className="gradient-primary rounded-t-lg">
              <h3 className="font-heading text-xl font-bold text-primary-foreground">
                Enrollment Form
              </h3>
              <p className="text-primary-foreground/80 text-sm">
                Fill in your details to get started
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter your full name"
                    className="border-primary/20 focus:border-primary"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter your 10-digit phone number"
                    className="border-primary/20 focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email Address (Optional)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="Enter your email"
                    className="border-primary/20 focus:border-primary"
                    maxLength={255}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="center" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Select Center *
                  </Label>
                  <Select 
                    value={formData.center} 
                    onValueChange={(value) => handleChange("center", value)}
                  >
                    <SelectTrigger className="border-primary/20 focus:border-primary">
                      <SelectValue placeholder="Choose your preferred center" />
                    </SelectTrigger>
                    <SelectContent>
                      {centers.map((center) => (
                        <SelectItem key={center.id} value={center.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{center.name}</span>
                            <span className="text-xs text-muted-foreground">{center.address}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Select Course *
                  </Label>
                  <Select 
                    value={formData.course} 
                    onValueChange={(value) => handleChange("course", value)}
                  >
                    <SelectTrigger className="border-primary/20 focus:border-primary">
                      <SelectValue placeholder="Choose a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex items-center gap-2">
                            <span>{course.name} - {course.full_name}</span>
                            {course.is_popular && (
                              <Badge className="gradient-gold text-xs">Popular</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Preferred Batch Timing
                  </Label>
                  <Select 
                    value={formData.preferredTime} 
                    onValueChange={(value) => handleChange("preferredTime", value)}
                  >
                    <SelectTrigger className="border-primary/20 focus:border-primary">
                      <SelectValue placeholder="Select batch timing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12 PM - 4 PM)</SelectItem>
                      <SelectItem value="evening">Evening (4 PM - 8 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Payment Method
                  </Label>
                  <RadioGroup 
                    value={formData.paymentMethod} 
                    onValueChange={(value) => handleChange("paymentMethod", value)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.paymentMethod === 'offline' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}>
                      <RadioGroupItem value="offline" id="offline" />
                      <Label htmlFor="offline" className="cursor-pointer flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Pay at Center</p>
                          <p className="text-xs text-muted-foreground">Pay when you visit</p>
                        </div>
                      </Label>
                    </div>
                    <div className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}>
                      <RadioGroupItem value="online" id="online" />
                      <Label htmlFor="online" className="cursor-pointer flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Pay Online</p>
                          <p className="text-xs text-muted-foreground">UPI/Card/NetBanking</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                  {formData.paymentMethod === 'online' && selectedCourse && (
                    <div className="p-3 bg-success/10 rounded-lg border border-success/30">
                      <p className="text-sm text-success font-medium flex items-center gap-2">
                        <IndianRupee className="w-4 h-4" />
                        Amount to pay: ₹{selectedCourse.fee.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full gradient-gold text-secondary-foreground font-semibold py-6 text-lg"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? "Processing..." : formData.paymentMethod === 'online' ? "💳 Proceed to Pay Online" : "📱 Enroll via WhatsApp"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By submitting, you agree to receive SMS/WhatsApp updates about your admission.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Selected Course Info */}
            {selectedCourse && (
              <Card className="shadow-elevated border-accent/30 bg-gradient-to-br from-accent/10 to-transparent">
                <CardContent className="p-6">
                  <h4 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-accent" />
                    Selected Course
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-2xl font-bold text-primary">{selectedCourse.name}</p>
                      <p className="text-muted-foreground">{selectedCourse.full_name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{selectedCourse.duration}</Badge>
                      <Badge variant="outline">{selectedCourse.category}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-2xl font-bold text-success">
                      <IndianRupee className="w-6 h-6" />
                      {selectedCourse.fee.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Center Info */}
            {selectedCenter && (
              <Card className="shadow-elevated border-secondary/30 bg-gradient-to-br from-secondary/10 to-transparent">
                <CardContent className="p-6">
                  <h4 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-secondary" />
                    Selected Center
                  </h4>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-primary">{selectedCenter.name}</p>
                    <p className="text-muted-foreground">{selectedCenter.address}</p>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedCenter.phone}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Centers List */}
            <Card className="shadow-elevated">
              <CardContent className="p-6">
                <h4 className="font-heading font-bold text-lg text-foreground mb-4">
                  Our Centers
                </h4>
                <div className="space-y-4">
                  {centers.map((center) => (
                    <div 
                      key={center.id} 
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        formData.center === center.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted hover:border-primary/50'
                      }`}
                      onClick={() => handleChange("center", center.id)}
                    >
                      <p className="font-semibold text-foreground">{center.name}</p>
                      <p className="text-sm text-muted-foreground">{center.address}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnrollmentForm;
