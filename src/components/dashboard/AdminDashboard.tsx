import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, BookOpen, GraduationCap, IndianRupee, 
  Award, Calendar, Search, UserPlus, CheckCircle, 
  Clock, AlertCircle, Trash2, Edit, Send
} from "lucide-react";

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  user_id: string;
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
  profiles: { full_name: string; email: string } | null;
  courses: { name: string; full_name: string; fee: number } | null;
}

interface Course {
  id: string;
  name: string;
  full_name: string;
  duration: string;
  fee: number;
  discount_percent: number;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch users (profiles)
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersData) setUsers(usersData);

    // Fetch enrollments
    const { data: enrollData } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (name, full_name, fee)
      `)
      .order('created_at', { ascending: false });
    
    if (enrollData) {
      // Map profiles to enrollments
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

    setLoading(false);
  };

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

  const issueCertificate = async (enrollmentId: string) => {
    const certNumber = `MCC-${Date.now().toString(36).toUpperCase()}`;
    
    const { error } = await supabase
      .from('certificates')
      .insert({
        enrollment_id: enrollmentId,
        certificate_number: certNumber,
      });

    if (error) {
      if (error.code === '23505') {
        toast({ title: "Info", description: "Certificate already issued for this enrollment" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Success", description: `Certificate ${certNumber} issued!` });
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
    // Can't delete from auth directly, but can remove profile
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

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEnrollments = enrollments.filter(e =>
    e.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.courses?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Stats
  const totalRevenue = enrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
  const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
  const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>

        <Card>
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

        <Card>
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

        <Card>
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
        <TabsList>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
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
                              onClick={() => issueCertificate(enrollment.id)}
                              disabled={enrollment.status !== 'completed'}
                            >
                              <Award className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAttendance(enrollment.id, true)}
                            >
                              <Calendar className="w-4 h-4" />
                            </Button>
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

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>All Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Enrollments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{course.name}</p>
                            <p className="text-sm text-muted-foreground">{course.full_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>{course.duration}</TableCell>
                        <TableCell>₹{course.fee.toLocaleString()}</TableCell>
                        <TableCell>
                          {course.discount_percent > 0 ? (
                            <Badge className="gradient-gold text-secondary-foreground">
                              {course.discount_percent}% OFF
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {enrollments.filter(e => e.course_id === course.id).length}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Mark Today's Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.filter(e => e.status === 'active').map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">
                          {enrollment.profiles?.full_name}
                        </TableCell>
                        <TableCell>{enrollment.courses?.name}</TableCell>
                        <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-success hover:bg-success/90"
                              onClick={() => markAttendance(enrollment.id, true)}
                            >
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => markAttendance(enrollment.id, false)}
                            >
                              Absent
                            </Button>
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
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
