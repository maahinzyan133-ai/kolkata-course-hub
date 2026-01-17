import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Award, Calendar, Download, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Enrollment {
  id: string;
  course_id: string;
  enrollment_date: string;
  status: string;
  batch_timing: string;
  payment_status: string;
  courses: {
    name: string;
    full_name: string;
    duration: string;
    fee: number;
  };
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

    // Fetch enrollments
    const { data: enrollData } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (name, full_name, duration, fee)
      `)
      .eq('user_id', user.id);

    if (enrollData) {
      setEnrollments(enrollData as Enrollment[]);

      // Fetch attendance for each enrollment
      const attendanceData: Record<string, Attendance[]> = {};
      for (const enrollment of enrollData) {
        const { data: attData } = await supabase
          .from('attendance')
          .select('*')
          .eq('enrollment_id', enrollment.id)
          .order('session_date', { ascending: false });
        
        if (attData) {
          attendanceData[enrollment.id] = attData;
        }
      }
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
      {/* Welcome Card */}
      <Card className="gradient-primary text-primary-foreground">
        <CardContent className="p-6">
          <h2 className="font-heading text-2xl font-bold mb-2">
            Welcome, {profile?.full_name || "Student"}!
          </h2>
          <p className="opacity-90">Track your courses, attendance, and certificates here.</p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{enrollments.length}</p>
              <p className="text-sm text-muted-foreground">Enrolled Courses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 gradient-gold rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{certificates.length}</p>
              <p className="text-sm text-muted-foreground">Certificates</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-success rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-success-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Object.values(attendance).flat().filter(a => a.present).length}
              </p>
              <p className="text-sm text-muted-foreground">Days Attended</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  You haven't enrolled in any courses yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {enrollments.map((enrollment) => (
                    <Card key={enrollment.id} className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h4 className="font-heading font-semibold">
                              {enrollment.courses.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {enrollment.courses.full_name}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {getStatusBadge(enrollment.status)}
                              {getPaymentBadge(enrollment.payment_status)}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="font-semibold">{enrollment.courses.duration}</p>
                            <p className="text-sm text-muted-foreground mt-2">Batch</p>
                            <p className="font-semibold">{enrollment.batch_timing || "N/A"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No attendance records available.
                </p>
              ) : (
                <div className="space-y-6">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id}>
                      <h4 className="font-heading font-semibold mb-3">
                        {enrollment.courses.name}
                      </h4>
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
                                <TableCell>
                                  {new Date(att.session_date).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {att.present ? (
                                    <Badge className="bg-success text-success-foreground">Present</Badge>
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
              <CardTitle>My Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              {certificates.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No certificates issued yet. Complete a course to receive your certificate.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {certificates.map((cert) => (
                    <Card key={cert.id} className="gradient-gold">
                      <CardContent className="p-6">
                        <Award className="w-10 h-10 text-secondary-foreground mb-4" />
                        <h4 className="font-heading font-bold text-secondary-foreground">
                          {cert.enrollments.courses.name}
                        </h4>
                        <p className="text-sm text-secondary-foreground/80 mb-2">
                          {cert.enrollments.courses.full_name}
                        </p>
                        <p className="text-xs text-secondary-foreground/70 mb-4">
                          Certificate #: {cert.certificate_number}
                        </p>
                        <p className="text-xs text-secondary-foreground/70 mb-4">
                          Issued: {new Date(cert.issue_date).toLocaleDateString()}
                        </p>
                        {cert.file_url && (
                          <Button size="sm" className="bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90">
                            <Download className="w-4 h-4 mr-2" />
                            Download
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
