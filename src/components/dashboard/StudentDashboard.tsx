import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { generateReceiptPDF, generateAllPaymentsReceiptPDF } from "@/lib/generateReceipt";
import { 
  BookOpen, Award, Calendar, Download, CheckCircle, Clock, AlertCircle,
  Play, Trophy, Target, Zap, Star, TrendingUp, MapPin, IndianRupee, History, FileText
} from "lucide-react";

interface Enrollment {
  id: string;
  course_id: string;
  enrollment_date: string;
  status: string;
  batch_timing: string;
  payment_status: string;
  amount_paid: number;
  center_id: string | null;
  courses: {
    id: string;
    name: string;
    full_name: string;
    duration: string;
    fee: number;
  };
  centers?: {
    name: string;
  } | null;
}

interface PaymentHistory {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string | null;
  notes: string | null;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  duration_minutes: number;
}

interface LessonProgress {
  id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

interface Attendance {
  id: string;
  session_date: string;
  present: boolean;
  notes: string | null;
}

interface Certificate {
  id: string;
  certificate_number: string;
  issue_date: string;
  file_url: string | null;
  enrollments: {
    courses: {
      name: string;
      full_name: string;
    };
  };
}

interface Center {
  id: string;
  name: string;
}

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [progress, setProgress] = useState<Record<string, LessonProgress[]>>({});
  const [attendance, setAttendance] = useState<Record<string, Attendance[]>>({});
  const [paymentHistory, setPaymentHistory] = useState<Record<string, PaymentHistory[]>>({});
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch centers
    const { data: centersData } = await supabase
      .from('centers')
      .select('*')
      .order('name');
    
    if (centersData) setCenters(centersData);

    // Fetch enrollments with courses and centers
    const { data: enrollData } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (id, name, full_name, duration, fee),
        centers (name)
      `)
      .eq('user_id', user.id);

    if (enrollData) {
      setEnrollments(enrollData as Enrollment[]);

      // Fetch lessons, progress, attendance, and payment history for each enrollment
      const lessonsData: Record<string, Lesson[]> = {};
      const progressData: Record<string, LessonProgress[]> = {};
      const attendanceData: Record<string, Attendance[]> = {};
      const paymentData: Record<string, PaymentHistory[]> = {};

      for (const enrollment of enrollData) {
        // Fetch lessons
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', enrollment.course_id)
          .order('order_index');
        
        if (lessonData) {
          lessonsData[enrollment.id] = lessonData;
        }

        // Fetch progress
        const { data: progData } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('enrollment_id', enrollment.id);
        
        if (progData) {
          progressData[enrollment.id] = progData;
        }

        // Fetch attendance
        const { data: attData } = await supabase
          .from('attendance')
          .select('*')
          .eq('enrollment_id', enrollment.id)
          .order('session_date', { ascending: false });
        
        if (attData) {
          attendanceData[enrollment.id] = attData;
        }

        // Fetch payment history
        const { data: payData } = await supabase
          .from('payment_history')
          .select('*')
          .eq('enrollment_id', enrollment.id)
          .order('payment_date', { ascending: false });
        
        if (payData) {
          paymentData[enrollment.id] = payData;
        }
      }

      setLessons(lessonsData);
      setProgress(progressData);
      setAttendance(attendanceData);
      setPaymentHistory(paymentData);
    }

    // Fetch certificates
    const { data: certData } = await supabase
      .from('certificates')
      .select(`
        *,
        enrollments!inner (
          user_id,
          courses (name, full_name)
        )
      `)
      .eq('enrollments.user_id', user.id);

    if (certData) {
      setCertificates(certData as unknown as Certificate[]);
    }

    setLoading(false);
  };

  const markLessonComplete = async (enrollmentId: string, lessonId: string) => {
    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      });

    if (!error) {
      fetchData();
    }
  };

  const getProgressPercentage = (enrollmentId: string) => {
    const enrollmentLessons = lessons[enrollmentId] || [];
    const enrollmentProgress = progress[enrollmentId] || [];
    
    if (enrollmentLessons.length === 0) return 0;
    
    const completedCount = enrollmentProgress.filter(p => p.completed).length;
    return Math.round((completedCount / enrollmentLessons.length) * 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "active":
        return <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0"><Clock className="w-3 h-3 mr-1" />Active</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">Paid</Badge>;
      case "partial":
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">Partial</Badge>;
      case "pending":
        return <Badge variant="destructive">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Filter enrollments by center
  const filteredEnrollments = selectedCenter === "all" 
    ? enrollments 
    : enrollments.filter(e => e.center_id === selectedCenter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const totalProgress = filteredEnrollments.length > 0 
    ? Math.round(filteredEnrollments.reduce((acc, e) => acc + getProgressPercentage(e.id), 0) / filteredEnrollments.length)
    : 0;

  const totalPaid = filteredEnrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
  const totalFees = filteredEnrollments.reduce((sum, e) => sum + (e.courses?.fee || 0), 0);
  const totalDue = totalFees - totalPaid;

  return (
    <div className="space-y-6">
      {/* Center Filter */}
      {centers.length > 1 && (
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

      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-primary via-accent to-secondary border-0 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <CardContent className="p-8 relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-heading text-3xl font-bold">
                Welcome back, {profile?.full_name?.split(' ')[0] || "Student"}!
              </h2>
              <p className="opacity-90">Continue your learning journey today</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{filteredEnrollments.length}</p>
              <p className="text-sm opacity-80">Courses</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{totalProgress}%</p>
              <p className="text-sm opacity-80">Progress</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">₹{totalPaid.toLocaleString()}</p>
              <p className="text-sm opacity-80">Paid</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">₹{totalDue.toLocaleString()}</p>
              <p className="text-sm opacity-80">Due</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold">{filteredEnrollments.length}</p>
              <p className="text-sm text-muted-foreground">Enrolled Courses</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold">{totalProgress}%</p>
              <p className="text-sm text-muted-foreground">Avg Progress</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold">{certificates.length}</p>
              <p className="text-sm text-muted-foreground">Certificates</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold">
                {Object.values(attendance).flat().filter(a => a.present).length}
              </p>
              <p className="text-sm text-muted-foreground">Days Attended</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 flex-wrap">
          <TabsTrigger value="courses" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white">
            <BookOpen className="w-4 h-4" />
            My Courses
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white">
            <IndianRupee className="w-4 h-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white">
            <Calendar className="w-4 h-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="certificates" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white">
            <Award className="w-4 h-4" />
            Certificates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Enrolled Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEnrollments.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">You haven't enrolled in any courses yet.</p>
                  <Button className="mt-4 bg-gradient-to-r from-primary to-accent">Browse Courses</Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredEnrollments.map((enrollment) => {
                    const progressPercent = getProgressPercentage(enrollment.id);
                    const due = (enrollment.courses?.fee || 0) - (enrollment.amount_paid || 0);
                    return (
                      <Card key={enrollment.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                        <div className="h-2 bg-gradient-to-r from-primary via-accent to-secondary" style={{ width: `${progressPercent}%` }} />
                        <CardContent className="p-6">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-heading text-xl font-bold">{enrollment.courses.name}</h4>
                                {progressPercent === 100 && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                              </div>
                              <p className="text-muted-foreground mb-3">{enrollment.courses.full_name}</p>
                              <div className="flex flex-wrap gap-2">
                                {getStatusBadge(enrollment.status)}
                                {getPaymentBadge(enrollment.payment_status)}
                                {enrollment.centers?.name && (
                                  <Badge variant="outline" className="gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {enrollment.centers.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right space-y-2">
                              <div>
                                <p className="text-sm text-muted-foreground">Progress</p>
                                <p className="text-2xl font-bold text-primary">{progressPercent}%</p>
                              </div>
                              {due > 0 && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Due</p>
                                  <p className="text-lg font-bold text-destructive">₹{due.toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-4">
                            <Progress value={progressPercent} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Payment History & Dues
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Payment Summary */}
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
                  <CardContent className="p-4 text-center">
                    <IndianRupee className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200">
                  <CardContent className="p-4 text-center">
                    <IndianRupee className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-600">₹{totalFees.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Fees</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200">
                  <CardContent className="p-4 text-center">
                    <IndianRupee className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-600">₹{totalDue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Due</p>
                  </CardContent>
                </Card>
              </div>

              {/* Course-wise breakdown */}
              <div className="space-y-6">
                {filteredEnrollments.map((enrollment) => {
                  const history = paymentHistory[enrollment.id] || [];
                  const due = (enrollment.courses?.fee || 0) - (enrollment.amount_paid || 0);

                  return (
                    <div key={enrollment.id} className="border rounded-xl p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <div>
                          <h4 className="font-heading font-bold">{enrollment.courses.name}</h4>
                          <p className="text-sm text-muted-foreground">{enrollment.courses.full_name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Course Fee</p>
                            <p className="font-bold">₹{enrollment.courses.fee.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Paid</p>
                            <p className="font-bold text-green-600">₹{(enrollment.amount_paid || 0).toLocaleString()}</p>
                          </div>
                          {due > 0 && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Due</p>
                              <p className="font-bold text-red-600">₹{due.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {history.length > 0 && (
                        <>
                          <div className="flex justify-end mb-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateAllPaymentsReceiptPDF(
                                profile?.full_name || "Student",
                                profile?.email || "",
                                enrollment.courses.name,
                                enrollment.courses.full_name,
                                enrollment.centers?.name || "",
                                enrollment.courses.fee,
                                history
                              )}
                              className="gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              Download Statement
                            </Button>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Receipt</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="text-right">Download</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {history.map((payment) => (
                                <TableRow key={payment.id}>
                                  <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                                  <TableCell className="font-medium text-green-600">₹{payment.amount.toLocaleString()}</TableCell>
                                  <TableCell className="capitalize">{payment.payment_method}</TableCell>
                                  <TableCell>{payment.receipt_number || '-'}</TableCell>
                                  <TableCell>{payment.notes || '-'}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => generateReceiptPDF({
                                        receiptNumber: payment.receipt_number || `RCP-${payment.id.slice(0, 8)}`,
                                        studentName: profile?.full_name || "Student",
                                        studentEmail: profile?.email || "",
                                        courseName: enrollment.courses.name,
                                        courseFullName: enrollment.courses.full_name,
                                        centerName: enrollment.centers?.name || "",
                                        paymentDate: new Date(payment.payment_date).toLocaleDateString(),
                                        amount: payment.amount,
                                        paymentMethod: payment.payment_method,
                                        totalFee: enrollment.courses.fee,
                                        totalPaid: enrollment.amount_paid || 0,
                                        balanceDue: due,
                                        notes: payment.notes || undefined
                                      })}
                                      className="text-primary hover:text-primary/80"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </>
                      )}
                      {history.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No payment history available</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Course Progress & Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEnrollments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No courses to show progress for.</p>
              ) : (
                <div className="space-y-8">
                  {filteredEnrollments.map((enrollment) => {
                    const enrollmentLessons = lessons[enrollment.id] || [];
                    const enrollmentProgress = progress[enrollment.id] || [];
                    const progressPercent = getProgressPercentage(enrollment.id);

                    return (
                      <div key={enrollment.id} className="border rounded-xl p-6 bg-muted/30">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-heading text-lg font-bold">{enrollment.courses.name}</h4>
                            <p className="text-sm text-muted-foreground">{enrollment.courses.full_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{progressPercent}%</p>
                            <p className="text-sm text-muted-foreground">
                              {enrollmentProgress.filter(p => p.completed).length} / {enrollmentLessons.length} lessons
                            </p>
                          </div>
                        </div>
                        <Progress value={progressPercent} className="h-3 mb-4" />
                        
                        {enrollmentLessons.length > 0 ? (
                          <div className="space-y-2">
                            {enrollmentLessons.map((lesson, idx) => {
                              const isCompleted = enrollmentProgress.some(p => p.lesson_id === lesson.id && p.completed);
                              return (
                                <div 
                                  key={lesson.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                    isCompleted 
                                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                      : 'bg-card hover:bg-muted/50'
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    isCompleted 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                                  </div>
                                  <div className="flex-1">
                                    <p className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                      {lesson.title}
                                    </p>
                                    {lesson.description && (
                                      <p className="text-sm text-muted-foreground">{lesson.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {lesson.duration_minutes} min
                                    </Badge>
                                    {!isCompleted && (
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => markLessonComplete(enrollment.id, lesson.id)}
                                      >
                                        <Play className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No lessons added to this course yet.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Attendance Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEnrollments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No courses to show attendance for.</p>
              ) : (
                <div className="space-y-6">
                  {filteredEnrollments.map((enrollment) => {
                    const enrollmentAttendance = attendance[enrollment.id] || [];
                    const presentCount = enrollmentAttendance.filter(a => a.present).length;
                    const attendancePercent = enrollmentAttendance.length > 0 
                      ? Math.round((presentCount / enrollmentAttendance.length) * 100) 
                      : 0;

                    return (
                      <div key={enrollment.id} className="border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-heading font-bold">{enrollment.courses.name}</h4>
                            <p className="text-sm text-muted-foreground">{enrollment.courses.full_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary">{attendancePercent}%</p>
                            <p className="text-sm text-muted-foreground">{presentCount} / {enrollmentAttendance.length} days</p>
                          </div>
                        </div>
                        
                        {enrollmentAttendance.length > 0 ? (
                          <div className="grid grid-cols-7 gap-2">
                            {enrollmentAttendance.slice(0, 28).map((att) => (
                              <div 
                                key={att.id}
                                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                                  att.present 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-red-500 text-white'
                                }`}
                                title={`${new Date(att.session_date).toLocaleDateString()} - ${att.present ? 'Present' : 'Absent'}`}
                              >
                                {new Date(att.session_date).getDate()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">No attendance records yet</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                My Certificates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {certificates.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No certificates earned yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">Complete your courses to earn certificates!</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {certificates.map((cert) => (
                    <Card key={cert.id} className="overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Award className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-heading font-bold text-lg">{cert.enrollments.courses.name}</h4>
                            <p className="text-sm text-muted-foreground">{cert.enrollments.courses.full_name}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Certificate #{cert.certificate_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Issued: {new Date(cert.issue_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {cert.file_url && (
                          <Button 
                            className="w-full mt-4 gradient-gold text-secondary-foreground"
                            onClick={() => window.open(cert.file_url!, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Certificate
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
