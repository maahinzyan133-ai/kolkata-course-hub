import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CertificateRequest {
  enrollment_id: string;
}

const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AMC-${year}-${random}`;
};

const generateCertificateHTML = (
  studentName: string,
  courseName: string,
  certificateNumber: string,
  issueDate: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@400;700&family=Open+Sans:wght@400;600&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    .certificate {
      width: 1123px;
      height: 794px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      position: relative;
      font-family: 'Open Sans', sans-serif;
      overflow: hidden;
    }
    
    .border-design {
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      border: 3px solid #e94560;
      border-radius: 10px;
    }
    
    .inner-border {
      position: absolute;
      top: 35px;
      left: 35px;
      right: 35px;
      bottom: 35px;
      border: 1px solid rgba(233, 69, 96, 0.5);
      border-radius: 8px;
    }
    
    .corner-decoration {
      position: absolute;
      width: 80px;
      height: 80px;
      border: 3px solid #e94560;
    }
    
    .corner-tl { top: 50px; left: 50px; border-right: none; border-bottom: none; }
    .corner-tr { top: 50px; right: 50px; border-left: none; border-bottom: none; }
    .corner-bl { bottom: 50px; left: 50px; border-right: none; border-top: none; }
    .corner-br { bottom: 50px; right: 50px; border-left: none; border-top: none; }
    
    .content {
      position: absolute;
      top: 80px;
      left: 100px;
      right: 100px;
      bottom: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    
    .logo-area {
      margin-bottom: 15px;
    }
    
    .logo-text {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      color: #e94560;
      letter-spacing: 2px;
    }
    
    .title {
      font-family: 'Playfair Display', serif;
      font-size: 52px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 8px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    
    .subtitle {
      font-size: 16px;
      color: rgba(255,255,255,0.7);
      letter-spacing: 4px;
      margin-bottom: 30px;
    }
    
    .presented-to {
      font-size: 14px;
      color: rgba(255,255,255,0.6);
      letter-spacing: 3px;
      margin-bottom: 10px;
    }
    
    .student-name {
      font-family: 'Great Vibes', cursive;
      font-size: 56px;
      color: #e94560;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .description {
      font-size: 14px;
      color: rgba(255,255,255,0.8);
      line-height: 1.8;
      max-width: 700px;
      margin-bottom: 25px;
    }
    
    .course-name {
      font-family: 'Playfair Display', serif;
      font-size: 26px;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(90deg, #e94560, #ff6b6b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 30px;
    }
    
    .details-row {
      display: flex;
      justify-content: center;
      gap: 100px;
      margin-bottom: 30px;
    }
    
    .detail-item {
      text-align: center;
    }
    
    .detail-label {
      font-size: 10px;
      color: rgba(255,255,255,0.5);
      letter-spacing: 2px;
      margin-bottom: 5px;
    }
    
    .detail-value {
      font-size: 14px;
      color: #fff;
      font-weight: 600;
    }
    
    .signature-row {
      display: flex;
      justify-content: center;
      gap: 200px;
    }
    
    .signature {
      text-align: center;
    }
    
    .signature-line {
      width: 150px;
      border-bottom: 2px solid rgba(255,255,255,0.3);
      margin-bottom: 8px;
    }
    
    .signature-text {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
    }
    
    .seal {
      position: absolute;
      bottom: 100px;
      right: 120px;
      width: 100px;
      height: 100px;
      border: 3px solid #e94560;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(233, 69, 96, 0.1);
    }
    
    .seal-text {
      font-family: 'Playfair Display', serif;
      font-size: 11px;
      color: #e94560;
      text-align: center;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="border-design"></div>
    <div class="inner-border"></div>
    <div class="corner-decoration corner-tl"></div>
    <div class="corner-decoration corner-tr"></div>
    <div class="corner-decoration corner-bl"></div>
    <div class="corner-decoration corner-br"></div>
    
    <div class="content">
      <div class="logo-area">
        <div class="logo-text">Abbas Molla Computer</div>
      </div>
      
      <h1 class="title">Certificate</h1>
      <p class="subtitle">OF COMPLETION</p>
      
      <p class="presented-to">THIS IS PROUDLY PRESENTED TO</p>
      
      <h2 class="student-name">${studentName}</h2>
      
      <p class="description">
        For successfully completing the course with dedication and excellence,
        demonstrating outstanding commitment to learning and professional development.
      </p>
      
      <p class="course-name">${courseName}</p>
      
      <div class="details-row">
        <div class="detail-item">
          <p class="detail-label">CERTIFICATE NO.</p>
          <p class="detail-value">${certificateNumber}</p>
        </div>
        <div class="detail-item">
          <p class="detail-label">DATE OF ISSUE</p>
          <p class="detail-value">${issueDate}</p>
        </div>
      </div>
      
      <div class="signature-row">
        <div class="signature">
          <div class="signature-line"></div>
          <p class="signature-text">Director</p>
        </div>
        <div class="signature">
          <div class="signature-line"></div>
          <p class="signature-text">Instructor</p>
        </div>
      </div>
    </div>
    
    <div class="seal">
      <div class="seal-text">VERIFIED<br>AUTHENTIC</div>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  console.log("Generate certificate function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { enrollment_id }: CertificateRequest = await req.json();
    console.log("Generating certificate for enrollment:", enrollment_id);

    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select(`
        id,
        user_id,
        course_id,
        courses (name, full_name)
      `)
      .eq("id", enrollment_id)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      console.error("Enrollment not found:", enrollmentError);
      throw new Error("Enrollment not found");
    }

    // Get student profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", enrollment.user_id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Profile not found:", profileError);
      throw new Error("Student profile not found");
    }

    const certificateNumber = generateCertificateNumber();
    const issueDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const courseName = (enrollment.courses as any)?.full_name || (enrollment.courses as any)?.name || "Course";
    
    // Generate HTML content
    const htmlContent = generateCertificateHTML(
      profile.full_name,
      courseName,
      certificateNumber,
      issueDate
    );

    // Store certificate record
    const { data: certificate, error: certError } = await supabase
      .from("certificates")
      .insert({
        enrollment_id,
        certificate_number: certificateNumber,
        issue_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (certError) {
      console.error("Error creating certificate record:", certError);
      throw new Error("Failed to create certificate record");
    }

    console.log("Certificate created:", certificate);

    // Update enrollment status to completed
    await supabase
      .from("enrollments")
      .update({ status: "completed" })
      .eq("id", enrollment_id);

    return new Response(
      JSON.stringify({
        success: true,
        certificate,
        html: htmlContent,
        student_name: profile.full_name,
        course_name: courseName,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in generate-certificate function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
