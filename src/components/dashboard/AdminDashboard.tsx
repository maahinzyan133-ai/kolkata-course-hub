import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateReceiptPDF } from "@/lib/generateReceipt";
import { 
  Users, BookOpen, GraduationCap, IndianRupee, 
  Award, Calendar, Search, CheckCircle, 
  Clock, AlertCircle, Trash2, Bell, MapPin, Plus, Play, Video, Trophy, History, Star, Download, Shield
} from "lucide-react";

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  user_id: string;
  center_id: string | null;
}

interface Center {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_date: string;
  status: string;
  batch_timing: string;
  payment_status: string;
  amount_paid: number;
  center_id: string | null;
  profiles: { full_name: string; email: string } | null;
  courses: { name: string; full_name: string; fee: number } | null;
  centers?: { name: string } | null;
}

interface Course {
  id: string;
  name: string;
  full_name: string;
  duration: string;
  fee: number;
  discount_percent: number;
}

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  course_id: string | null;
  center_id: string | null;
  is_public: boolean;
  courses?: { name: string } | null;
  centers?: { name: string } | null;
}

interface Achievement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  student_name: string | null;
  course_name: string | null;
  center_id: string | null;
  achievement_date: string | null;
  is_featured: boolean;
  centers?: { name: string } | null;
}

interface PaymentHistory {
  id: string;
  enrollment_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string | null;
  notes: string | null;
  enrollments?: {
    profiles?: { full_name: string } | null;
    courses?: { name: string } | null;
  } | null;
}

const AdminDashboard = () => {
  const { adminCenterId } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // For center-specific admins, auto-select their center
  const [selectedCenter, setSelectedCenter] = useState<string>(adminCenterId || "all");
  const { toast } = useToast();

  // Form states
  const [newVideo, setNewVideo] = useState({ title: "", description: "", video_url: "", thumbnail_url: "", course_id: "", center_id: adminCenterId || "", is_public: true });
  const [newAchievement, setNewAchievement] = useState({ title: "", description: "", image_url: "", student_name: "", course_name: "", center_id: adminCenterId || "", is_featured: false });
  const [newPayment, setNewPayment] = useState({ enrollment_id: "", amount: "", payment_method: "cash", receipt_number: "", notes: "" });

  // Check if admin is center-specific (cannot switch centers)
  const isCenterAdmin = adminCenterId !== null;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch centers
    const { data: centersData } = await supabase
      .from('centers')
      .select('*')
      .order('name');
    
    if (centersData) setCenters(centersData);

    // Fetch users (profiles)
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersData) setUsers(usersData);

    // Fetch enrollments with centers
    const { data: enrollData } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (name, full_name, fee),
        centers (name)
      `)
      .order('created_at', { ascending: false });
    
    if (enrollData) {
      const enrichedEnrollments = await Promise.all(
        enrollData.map(async (e) => {
          const profile = usersData?.find(u => u.user_id === e.user_id);
          return {
            ...e,
            profiles: profile ? { full_name: profile.full_name, email: profile.email } : null
          };
        })
      );
      setEnrollments(enrichedEnrollments as Enrollment[]);
    }

    // Fetch courses
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .order('name');
    
    if (coursesData) setCourses(coursesData);

    // Fetch videos
    const { data: videosData } = await supabase
      .from('videos')
      .select(`*, courses(name), centers(name)`)
      .order('created_at', { ascending: false });
    
    if (videosData) setVideos(videosData);

    // Fetch achievements
    const { data: achievementsData } = await supabase
      .from('achievements')
      .select(`*, centers(name)`)
      .order('created_at', { ascending: false });
    
    if (achievementsData) setAchievements(achievementsData);

    // Fetch payment history
    const { data: paymentsData } = await supabase
      .from('payment_history')
      .select(`*`)
      .order('payment_date', { ascending: false });
    
    if (paymentsData) {
      // Enrich with enrollment info
      const enrichedPayments = await Promise.all(
        paymentsData.map(async (p) => {
          const enrollment = enrollData?.find(e => e.id === p.enrollment_id);
          const profile = usersData?.find(u => u.user_id === enrollment?.user_id);
          return {
            ...p,
            enrollments: {
              profiles: profile ? { full_name: profile.full_name } : null,
              courses: enrollment?.courses
            }
          };
        })
      );
      setPaymentHistory(enrichedPayments);
    }

    setLoading(false);
  };

  // Filter by center - strict filtering (only show users from selected center, not unassigned)
  const filteredUsers = users.filter(u => 
    (selectedCenter === "all" || u.center_id === selectedCenter) &&
    (u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredEnrollments = enrollments.filter(e =>
    (selectedCenter === "all" || e.center_id === selectedCenter) &&
    (e.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.courses?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // For videos - strict: only show videos that belong to the selected center (not unassigned ones)
  const filteredVideos = videos.filter(v =>
    selectedCenter === "all" ? true : v.center_id === selectedCenter
  );

  // For achievements - strict: only show achievements that belong to the selected center
  const filteredAchievements = achievements.filter(a =>
    selectedCenter === "all" ? true : a.center_id === selectedCenter
  );

  const filteredPayments = paymentHistory.filter(p => {
    const enrollment = enrollments.find(e => e.id === p.enrollment_id);
    return selectedCenter === "all" || enrollment?.center_id === selectedCenter;
  });

  // Stats for selected center
  const totalRevenue = filteredEnrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
  const activeEnrollments = filteredEnrollments.filter(e => e.status === 'active').length;
  const completedEnrollments = filteredEnrollments.filter(e => e.status === 'completed').length;

  const updateEnrollmentStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('enrollments')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Enrollment status updated" });
      fetchData();
    }
  };

  const updatePaymentStatus = async (id: string, payment_status: string) => {
    const { error } = await supabase
      .from('enrollments')
      .update({ payment_status })
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Payment status updated" });
      fetchData();
    }
  };

  const issueCertificate = async (enrollmentId: string, userId: string, courseName: string) => {
    toast({ title: "Generating...", description: "Creating certificate..." });
    
    const { data, error } = await supabase.functions.invoke('generate-certificate', {
      body: { enrollment_id: enrollmentId }
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Certificate ${data.certificate?.certificate_number} issued!` });
      
      await supabase.functions.invoke('send-notification', {
        body: { type: 'course_completion', user_id: userId, data: { course_name: courseName, certificate_number: data.certificate?.certificate_number } }
      });
      
      fetchData();
    }
  };

  const sendPaymentReminder = async (userId: string, courseName: string, amountDue: number) => {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: { type: 'payment_reminder', user_id: userId, data: { course_name: courseName, amount_due: amountDue } }
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Payment reminder sent!" });
    }
  };

  const markAttendance = async (enrollmentId: string, present: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('attendance')
      .upsert({
        enrollment_id: enrollmentId,
        session_date: today,
        present
      }, { onConflict: 'enrollment_id,session_date' });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Attendance marked as ${present ? 'present' : 'absent'}` });
    }
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "User profile deleted" });
      fetchData();
    }
  };

  const addVideo = async () => {
    if (!newVideo.title.trim() || !newVideo.video_url.trim()) {
      toast({ title: "Error", description: "Title and Video URL are required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('videos').insert({
      title: newVideo.title.trim(),
      description: newVideo.description.trim() || null,
      video_url: newVideo.video_url.trim(),
      thumbnail_url: newVideo.thumbnail_url.trim() || null,
      course_id: newVideo.course_id || null,
      center_id: newVideo.center_id || null,
      is_public: newVideo.is_public
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Video added!" });
      setNewVideo({ title: "", description: "", video_url: "", thumbnail_url: "", course_id: "", center_id: "", is_public: true });
      fetchData();
    }
  };

  const deleteVideo = async (id: string) => {
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (!error) {
      toast({ title: "Success", description: "Video deleted" });
      fetchData();
    }
  };

  const addAchievement = async () => {
    if (!newAchievement.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('achievements').insert({
      title: newAchievement.title.trim(),
      description: newAchievement.description.trim() || null,
      image_url: newAchievement.image_url.trim() || null,
      student_name: newAchievement.student_name.trim() || null,
      course_name: newAchievement.course_name.trim() || null,
      center_id: newAchievement.center_id || null,
      is_featured: newAchievement.is_featured
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Achievement added!" });
      setNewAchievement({ title: "", description: "", image_url: "", student_name: "", course_name: "", center_id: "", is_featured: false });
      fetchData();
    }
  };

  const deleteAchievement = async (id: string) => {
    const { error } = await supabase.from('achievements').delete().eq('id', id);
    if (!error) {
      toast({ title: "Success", description: "Achievement deleted" });
      fetchData();
    }
  };

  const addPayment = async () => {
    if (!newPayment.enrollment_id || !newPayment.amount) {
      toast({ title: "Error", description: "Enrollment and amount are required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('payment_history').insert({
      enrollment_id: newPayment.enrollment_id,
      amount: parseFloat(newPayment.amount),
      payment_method: newPayment.payment_method,
      receipt_number: newPayment.receipt_number.trim() || null,
      notes: newPayment.notes.trim() || null
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Update enrollment amount_paid
      const enrollment = enrollments.find(e => e.id === newPayment.enrollment_id);
      if (enrollment) {
        const newTotal = (enrollment.amount_paid || 0) + parseFloat(newPayment.amount);
        await supabase.from('enrollments').update({ 
          amount_paid: newTotal,
          payment_status: newTotal >= (enrollment.courses?.fee || 0) ? 'paid' : 'partial'
        }).eq('id', newPayment.enrollment_id);
      }

      toast({ title: "Success", description: "Payment recorded!" });
      setNewPayment({ enrollment_id: "", amount: "", payment_method: "cash", receipt_number: "", notes: "" });
      fetchData();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "active":
        return <Badge className="gradient-primary text-primary-foreground"><Clock className="w-3 h-3 mr-1" />Active</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-success text-success-foreground">Paid</Badge>;
      case "partial":
        return <Badge className="gradient-gold text-secondary-foreground">Partial</Badge>;
      case "pending":
        return <Badge variant="destructive">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Center Filter - Only show for super admins */}
      {isCenterAdmin ? (
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">
            Center Admin: <strong>{centers.find(c => c.id === adminCenterId)?.name || 'Your Center'}</strong>
          </span>
          <Badge variant="outline" className="ml-auto">Center-specific access</Badge>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCenter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCenter("all")}
            className={selectedCenter === "all" ? "gradient-primary" : ""}
          >
            <MapPin className="w-4 h-4 mr-1" />
            All Centers
          </Button>
          {centers.map(center => (
            <Button
              key={center.id}
              variant={selectedCenter === center.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCenter(center.id)}
              className={selectedCenter === center.id ? "gradient-primary" : ""}
            >
              <MapPin className="w-4 h-4 mr-1" />
              {center.name}
            </Button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredUsers.length}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 gradient-gold rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeEnrollments}</p>
              <p className="text-sm text-muted-foreground">Active Enrollments</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-success rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-success-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedEnrollments}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search students, courses..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="enrollments" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <CardTitle>All Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Center</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{enrollment.profiles?.full_name}</p>
                            <p className="text-sm text-muted-foreground">{enrollment.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{enrollment.courses?.name}</p>
                            <p className="text-sm text-muted-foreground">₹{enrollment.courses?.fee}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {enrollment.centers?.name && (
                            <Badge variant="outline" className="gap-1">
                              <MapPin className="w-3 h-3" />
                              {enrollment.centers.name}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={enrollment.status}
                            onValueChange={(value) => updateEnrollmentStatus(enrollment.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={enrollment.payment_status}
                            onValueChange={(value) => updatePaymentStatus(enrollment.id, value)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="partial">Partial</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              title="Issue Certificate"
                              onClick={() => issueCertificate(enrollment.id, enrollment.user_id, enrollment.courses?.name || '')}
                              disabled={enrollment.status !== 'completed'}
                            >
                              <Award className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              title="Mark Attendance"
                              onClick={() => markAttendance(enrollment.id, true)}
                            >
                              <Calendar className="w-4 h-4" />
                            </Button>
                            {enrollment.payment_status !== 'paid' && (
                              <Button
                                size="sm"
                                variant="outline"
                                title="Send Payment Reminder"
                                onClick={() => sendPaymentReminder(enrollment.user_id, enrollment.courses?.name || '', (enrollment.courses?.fee || 0) - enrollment.amount_paid)}
                              >
                                <Bell className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Payment History
              </CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record New Payment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Enrollment</Label>
                      <Select value={newPayment.enrollment_id} onValueChange={(v) => setNewPayment(p => ({ ...p, enrollment_id: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student enrollment" />
                        </SelectTrigger>
                        <SelectContent>
                          {enrollments.filter(e => e.payment_status !== 'paid').map(e => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.profiles?.full_name} - {e.courses?.name} (Due: ₹{(e.courses?.fee || 0) - (e.amount_paid || 0)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Amount (₹)</Label>
                      <Input 
                        type="number" 
                        value={newPayment.amount} 
                        onChange={(e) => setNewPayment(p => ({ ...p, amount: e.target.value }))}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <Select value={newPayment.payment_method} onValueChange={(v) => setNewPayment(p => ({ ...p, payment_method: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Receipt Number (Optional)</Label>
                      <Input 
                        value={newPayment.receipt_number} 
                        onChange={(e) => setNewPayment(p => ({ ...p, receipt_number: e.target.value }))}
                        placeholder="Enter receipt number"
                      />
                    </div>
                    <div>
                      <Label>Notes (Optional)</Label>
                      <Textarea 
                        value={newPayment.notes} 
                        onChange={(e) => setNewPayment(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Any notes"
                      />
                    </div>
                    <Button onClick={addPayment} className="w-full gradient-primary">
                      Record Payment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead className="text-right">Download</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const enrollment = enrollments.find(e => e.id === payment.enrollment_id);
                    const user = users.find(u => u.user_id === enrollment?.user_id);
                    const center = centers.find(c => c.id === enrollment?.center_id);
                    
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                        <TableCell>{payment.enrollments?.profiles?.full_name || '-'}</TableCell>
                        <TableCell>{payment.enrollments?.courses?.name || '-'}</TableCell>
                        <TableCell className="font-bold text-green-600">₹{payment.amount.toLocaleString()}</TableCell>
                        <TableCell className="capitalize">{payment.payment_method}</TableCell>
                        <TableCell>{payment.receipt_number || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateReceiptPDF({
                              receiptNumber: payment.receipt_number || `RCP-${payment.id.slice(0, 8)}`,
                              studentName: user?.full_name || "Student",
                              studentEmail: user?.email || "",
                              courseName: enrollment?.courses?.name || "Course",
                              courseFullName: enrollment?.courses?.full_name || "",
                              centerName: center?.name || "",
                              paymentDate: new Date(payment.payment_date).toLocaleDateString(),
                              amount: payment.amount,
                              paymentMethod: payment.payment_method,
                              totalFee: enrollment?.courses?.fee || 0,
                              totalPaid: enrollment?.amount_paid || 0,
                              balanceDue: (enrollment?.courses?.fee || 0) - (enrollment?.amount_paid || 0),
                              notes: payment.notes || undefined
                            })}
                            className="text-primary hover:text-primary/80"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>All Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "-"}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(user.user_id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Coaching Videos
              </CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Video
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Video</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Title *</Label>
                      <Input 
                        value={newVideo.title} 
                        onChange={(e) => setNewVideo(v => ({ ...v, title: e.target.value }))}
                        placeholder="Video title"
                      />
                    </div>
                    <div>
                      <Label>Video URL (YouTube/Vimeo embed) *</Label>
                      <Input 
                        value={newVideo.video_url} 
                        onChange={(e) => setNewVideo(v => ({ ...v, video_url: e.target.value }))}
                        placeholder="https://www.youtube.com/embed/..."
                      />
                    </div>
                    <div>
                      <Label>Thumbnail URL</Label>
                      <Input 
                        value={newVideo.thumbnail_url} 
                        onChange={(e) => setNewVideo(v => ({ ...v, thumbnail_url: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea 
                        value={newVideo.description} 
                        onChange={(e) => setNewVideo(v => ({ ...v, description: e.target.value }))}
                        placeholder="Video description"
                      />
                    </div>
                    <div>
                      <Label>Course (Optional)</Label>
                      <Select value={newVideo.course_id} onValueChange={(v) => setNewVideo(p => ({ ...p, course_id: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {courses.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Center (Optional)</Label>
                      <Select value={newVideo.center_id} onValueChange={(v) => setNewVideo(p => ({ ...p, center_id: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select center" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Centers</SelectItem>
                          {centers.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addVideo} className="w-full gradient-primary">
                      Add Video
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <Play className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-1">{video.title}</h4>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {video.courses?.name && <Badge variant="outline" className="text-xs">{video.courses.name}</Badge>}
                        {video.centers?.name && <Badge variant="secondary" className="text-xs">{video.centers.name}</Badge>}
                        {video.is_public && <Badge className="text-xs bg-green-500">Public</Badge>}
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => deleteVideo(video.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Achievements
              </CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Achievement
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Achievement</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Title *</Label>
                      <Input 
                        value={newAchievement.title} 
                        onChange={(e) => setNewAchievement(a => ({ ...a, title: e.target.value }))}
                        placeholder="Achievement title"
                      />
                    </div>
                    <div>
                      <Label>Student Name</Label>
                      <Input 
                        value={newAchievement.student_name} 
                        onChange={(e) => setNewAchievement(a => ({ ...a, student_name: e.target.value }))}
                        placeholder="Student name"
                      />
                    </div>
                    <div>
                      <Label>Course Name</Label>
                      <Input 
                        value={newAchievement.course_name} 
                        onChange={(e) => setNewAchievement(a => ({ ...a, course_name: e.target.value }))}
                        placeholder="Course name"
                      />
                    </div>
                    <div>
                      <Label>Image URL</Label>
                      <Input 
                        value={newAchievement.image_url} 
                        onChange={(e) => setNewAchievement(a => ({ ...a, image_url: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea 
                        value={newAchievement.description} 
                        onChange={(e) => setNewAchievement(a => ({ ...a, description: e.target.value }))}
                        placeholder="Description"
                      />
                    </div>
                    <div>
                      <Label>Center</Label>
                      <Select value={newAchievement.center_id} onValueChange={(v) => setNewAchievement(a => ({ ...a, center_id: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select center" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Centers</SelectItem>
                          {centers.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newAchievement.is_featured}
                        onChange={(e) => setNewAchievement(a => ({ ...a, is_featured: e.target.checked }))}
                      />
                      <Label>Featured Achievement</Label>
                    </div>
                    <Button onClick={addAchievement} className="w-full gradient-primary">
                      Add Achievement
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAchievements.map((achievement) => (
                  <Card key={achievement.id} className="overflow-hidden">
                    <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                      {achievement.image_url ? (
                        <img src={achievement.image_url} alt={achievement.title} className="w-full h-full object-cover" />
                      ) : (
                        <Trophy className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{achievement.title}</h4>
                        {achievement.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                      </div>
                      {achievement.student_name && <p className="text-sm text-muted-foreground">{achievement.student_name}</p>}
                      <div className="flex gap-1 mt-2">
                        {achievement.centers?.name && <Badge variant="secondary" className="text-xs">{achievement.centers.name}</Badge>}
                      </div>
                      <Button size="sm" variant="destructive" className="mt-2" onClick={() => deleteAchievement(achievement.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Center</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrollments.filter(e => e.status === 'active').map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">{enrollment.profiles?.full_name}</TableCell>
                      <TableCell>{enrollment.courses?.name}</TableCell>
                      <TableCell>
                        {enrollment.centers?.name && (
                          <Badge variant="outline">{enrollment.centers.name}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 hover:bg-green-100 text-green-600"
                            onClick={() => markAttendance(enrollment.id, true)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-50 hover:bg-red-100 text-red-600"
                            onClick={() => markAttendance(enrollment.id, false)}
                          >
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Absent
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
