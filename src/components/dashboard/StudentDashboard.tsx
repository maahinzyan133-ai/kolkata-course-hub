import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, Award, Calendar, Download, CheckCircle, Clock, AlertCircle,
  Play, Trophy, Target, Zap, Star, TrendingUp
} from "lucide-react";

interface Enrollment {
  id: string;
  course_id: string;
  enrollment_date: string;
  status: string;
  batch_timing: string;
  payment_status: string;
  courses: {
    id: string;
    name: string;
    full_name: string;
    duration: string;
    fee: number;
  };
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

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [progress, setProgress] = useState<Record<string, LessonProgress[]>>({});
  const [attendance, setAttendance] = useState<Record<string, Attendance[]>>({});
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch enrollments with courses
    const { data: enrollData } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (id, name, full_name, duration, fee)
      `)
      .eq('user_id', user.id);

    if (enrollData) {
      setEnrollments(enrollData as Enrollment[]);

      // Fetch lessons and progress for each course
      const lessonsData: Record<string, Lesson[]> = {};
      const progressData: Record<string, LessonProgress[]> = {};
      const attendanceData: Record<string, Attendance[]> = {};

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
      }

      setLessons(lessonsData);
      setProgress(progressData);
      setAttendance(attendanceData);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const totalProgress = enrollments.length > 0 
    ? Math.round(enrollments.reduce((acc, e) => acc + getProgressPercentage(e.id), 0) / enrollments.length)
    : 0;

  return (
    <div className="space-y-6">
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
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{enrollments.length}</p>
              <p className="text-sm opacity-80">Courses</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{totalProgress}%</p>
              <p className="text-sm opacity-80">Progress</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{certificates.length}</p>
              <p className="text-sm opacity-80">Certificates</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold">{enrollments.length}</p>
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
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="courses" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white">
            <BookOpen className="w-4 h-4" />
            My Courses
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
              {enrollments.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">You haven't enrolled in any courses yet.</p>
                  <Button className="mt-4 bg-gradient-to-r from-primary to-accent">Browse Courses</Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {enrollments.map((enrollment) => {
                    const progressPercent = getProgressPercentage(enrollment.id);
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
                              </div>
                            </div>
                            <div className="text-right space-y-2">
                              <div>
                                <p className="text-sm text-muted-foreground">Progress</p>
                                <p className="text-2xl font-bold text-primary">{progressPercent}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Duration</p>
                                <p className="font-semibold">{enrollment.courses.duration}</p>
                              </div>
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

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Course Progress & Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No courses to show progress for.</p>
              ) : (
                <div className="space-y-8">
                  {enrollments.map((enrollment) => {
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
                                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                                    isCompleted ? 'bg-green-500/10 border border-green-500/20' : 'bg-background border'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      isCompleted 
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                                        : 'bg-muted text-muted-foreground'
                                    }`}>
                                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : <span>{idx + 1}</span>}
                                    </div>
                                    <div>
                                      <p className={`font-medium ${isCompleted ? 'text-green-700' : ''}`}>{lesson.title}</p>
                                      {lesson.description && (
                                        <p className="text-sm text-muted-foreground">{lesson.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground">{lesson.duration_minutes} min</span>
                                    {!isCompleted && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => markLessonComplete(enrollment.id, lesson.id)}
                                        className="gap-1"
                                      >
                                        <Play className="w-3 h-3" />
                                        Complete
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No lessons available yet. Check back soon!
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
                Attendance Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No attendance records available.</p>
              ) : (
                <div className="space-y-6">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="border rounded-xl p-6 bg-muted/30">
                      <h4 className="font-heading font-semibold mb-4">{enrollment.courses.name}</h4>
                      {attendance[enrollment.id]?.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendance[enrollment.id].slice(0, 10).map((att) => (
                              <TableRow key={att.id}>
                                <TableCell>{new Date(att.session_date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  {att.present ? (
                                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">Present</Badge>
                                  ) : (
                                    <Badge variant="destructive">Absent</Badge>
                                  )}
                                </TableCell>
                                <TableCell>{att.notes || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
                      )}
                    </div>
                  ))}
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
                  <p className="text-muted-foreground">No certificates issued yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">Complete a course to receive your certificate.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {certificates.map((cert) => (
                    <Card key={cert.id} className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500">
                      <CardContent className="p-6 text-white">
                        <div className="flex items-start justify-between mb-4">
                          <Award className="w-12 h-12" />
                          <Badge className="bg-white/20 text-white border-0">Verified</Badge>
                        </div>
                        <h4 className="font-heading text-xl font-bold mb-1">
                          {cert.enrollments.courses.name}
                        </h4>
                        <p className="text-white/80 text-sm mb-4">
                          {cert.enrollments.courses.full_name}
                        </p>
                        <div className="bg-white/10 rounded-lg p-3 mb-4">
                          <p className="text-xs text-white/70">Certificate Number</p>
                          <p className="font-mono font-bold">{cert.certificate_number}</p>
                        </div>
                        <p className="text-xs text-white/70">
                          Issued: {new Date(cert.issue_date).toLocaleDateString()}
                        </p>
                        {cert.file_url && (
                          <Button size="sm" className="w-full mt-4 bg-white text-orange-600 hover:bg-white/90">
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
