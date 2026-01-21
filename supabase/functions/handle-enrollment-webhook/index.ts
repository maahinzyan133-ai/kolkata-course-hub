import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;
    const body = await req.text();

    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // For testing without webhook signature
      event = JSON.parse(body);
    }

    console.log("Webhook event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};

      console.log("Payment completed for:", metadata);

      const studentEmail = metadata.student_email;
      const studentName = metadata.student_name;
      const courseName = metadata.course_name;
      const centerName = metadata.center_name;
      const amountPaid = (session.amount_total || 0) / 100;

      // Send confirmation email
      if (studentEmail) {
        try {
          await resend.emails.send({
            from: "Abbas Molla Computer <onboarding@resend.dev>",
            to: [studentEmail],
            subject: `🎉 Enrollment Confirmed - ${courseName}`,
            html: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 16px;">
                <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
                  <h1 style="color: #667eea; margin-bottom: 20px; text-align: center;">🎓 Enrollment Confirmed!</h1>
                  <p style="color: #333; font-size: 18px; line-height: 1.6;">Dear <strong>${studentName}</strong>,</p>
                  <p style="color: #555; font-size: 16px; line-height: 1.8;">
                    Your payment has been successfully processed and your enrollment is confirmed!
                  </p>
                  <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #333;"><strong>Course:</strong> ${courseName}</p>
                    <p style="margin: 10px 0 0 0; color: #333;"><strong>Center:</strong> ${centerName}</p>
                    <p style="margin: 10px 0 0 0; color: #333;"><strong>Amount Paid:</strong> ₹${amountPaid.toLocaleString()}</p>
                    <p style="margin: 10px 0 0 0; color: #333;"><strong>Payment ID:</strong> ${session.payment_intent}</p>
                  </div>
                  <p style="color: #555; font-size: 16px;">
                    Please visit our center to complete your admission formalities. Bring this email as proof of payment.
                  </p>
                  <p style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
                    Best regards,<br><strong>Abbas Molla Computer Team</strong><br>
                    📞 +91 97330 89257
                  </p>
                </div>
              </div>
            `,
          });
          console.log("Confirmation email sent to:", studentEmail);
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }
      }

      // Store pending enrollment in database for admin review
      const { data: enrollmentRecord, error: insertError } = await supabase
        .from("notifications")
        .insert({
          user_id: "00000000-0000-0000-0000-000000000000", // System notification
          type: "new_enrollment",
          title: `💳 New Online Enrollment: ${studentName}`,
          message: `Course: ${courseName} | Center: ${centerName} | Amount: ₹${amountPaid} | Phone: ${metadata.student_phone} | Email: ${studentEmail || 'N/A'} | Payment ID: ${session.payment_intent}`,
        });

      if (insertError) {
        console.error("Failed to create notification:", insertError);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
