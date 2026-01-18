import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "admission" | "course_completion" | "payment_reminder";
  user_id: string;
  data?: {
    course_name?: string;
    student_name?: string;
    amount_due?: number;
    due_date?: string;
    certificate_number?: string;
  };
}

const getEmailContent = (type: string, data: NotificationRequest["data"], studentName: string) => {
  switch (type) {
    case "admission":
      return {
        subject: `🎉 Welcome to Abbas Molla Computer! Admission Confirmed`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 16px;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
              <h1 style="color: #667eea; margin-bottom: 20px; text-align: center;">🎓 Welcome Aboard!</h1>
              <p style="color: #333; font-size: 18px; line-height: 1.6;">Dear <strong>${studentName}</strong>,</p>
              <p style="color: #555; font-size: 16px; line-height: 1.8;">
                Congratulations! Your admission to <strong style="color: #764ba2;">${data?.course_name || "our course"}</strong> has been confirmed!
              </p>
              <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #333;">✅ Access your dashboard to view course materials</p>
                <p style="margin: 10px 0 0 0; color: #333;">✅ Track your progress and attendance</p>
                <p style="margin: 10px 0 0 0; color: #333;">✅ Connect with instructors</p>
              </div>
              <p style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
                Best regards,<br><strong>Abbas Molla Computer Team</strong>
              </p>
            </div>
          </div>
        `,
      };
    case "course_completion":
      return {
        subject: `🏆 Congratulations! You've Completed ${data?.course_name || "Your Course"}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px; border-radius: 16px;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
              <h1 style="color: #11998e; margin-bottom: 20px; text-align: center;">🎊 Course Completed!</h1>
              <p style="color: #333; font-size: 18px; line-height: 1.6;">Dear <strong>${studentName}</strong>,</p>
              <p style="color: #555; font-size: 16px; line-height: 1.8;">
                Congratulations on successfully completing <strong style="color: #38ef7d;">${data?.course_name || "the course"}</strong>!
              </p>
              ${data?.certificate_number ? `
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: white; font-size: 14px;">Certificate Number</p>
                <p style="margin: 5px 0 0 0; color: white; font-size: 24px; font-weight: bold;">${data.certificate_number}</p>
              </div>
              ` : ""}
              <p style="color: #555; font-size: 16px;">
                Your certificate is now available in your dashboard. Keep learning, keep growing!
              </p>
              <p style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
                Best regards,<br><strong>Abbas Molla Computer Team</strong>
              </p>
            </div>
          </div>
        `,
      };
    case "payment_reminder":
      return {
        subject: `💳 Payment Reminder - ${data?.course_name || "Course Fee"}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; border-radius: 16px;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
              <h1 style="color: #f5576c; margin-bottom: 20px; text-align: center;">💰 Payment Reminder</h1>
              <p style="color: #333; font-size: 18px; line-height: 1.6;">Dear <strong>${studentName}</strong>,</p>
              <p style="color: #555; font-size: 16px; line-height: 1.8;">
                This is a friendly reminder about your pending payment for <strong style="color: #f093fb;">${data?.course_name || "your course"}</strong>.
              </p>
              <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #333; font-size: 14px;">Amount Due</p>
                <p style="margin: 5px 0 0 0; color: #333; font-size: 28px; font-weight: bold;">₹${data?.amount_due || 0}</p>
                ${data?.due_date ? `<p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Due by: ${data.due_date}</p>` : ""}
              </div>
              <p style="color: #555; font-size: 16px;">
                Please complete your payment at your earliest convenience. Contact us if you have any questions.
              </p>
              <p style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
                Best regards,<br><strong>Abbas Molla Computer Team</strong>
              </p>
            </div>
          </div>
        `,
      };
    default:
      return {
        subject: "Notification from Abbas Molla Computer",
        html: `<p>You have a new notification.</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Send notification function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, user_id, data }: NotificationRequest = await req.json();
    console.log("Notification request:", { type, user_id, data });

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", user_id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Profile not found:", profileError);
      throw new Error("User profile not found");
    }

    const emailContent = getEmailContent(type, data, profile.full_name);

    console.log("Sending email to:", profile.email);
    const emailResponse = await resend.emails.send({
      from: "Abbas Molla Computer <onboarding@resend.dev>",
      to: [profile.email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Save notification to database
    await supabase.from("notifications").insert({
      user_id,
      type,
      title: emailContent.subject,
      message: `${type.replace("_", " ")} notification sent`,
    });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
