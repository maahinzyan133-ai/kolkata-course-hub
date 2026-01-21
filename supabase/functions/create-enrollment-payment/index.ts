import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnrollmentPaymentRequest {
  name: string;
  phone: string;
  email?: string;
  course_id: string;
  center_id: string;
  preferred_time?: string;
  amount: number;
  course_name: string;
  center_name: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const body: EnrollmentPaymentRequest = await req.json();
    console.log("Enrollment payment request:", body);

    const { name, phone, email, course_id, center_id, preferred_time, amount, course_name, center_name } = body;

    if (!name || !phone || !course_id || !center_id || !amount) {
      throw new Error("Missing required fields: name, phone, course_id, center_id, amount");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists by email or create new
    let customerId: string | undefined;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email,
          name,
          phone,
          metadata: {
            center_id,
            center_name,
          }
        });
        customerId = customer.id;
      }
    }

    // Create a one-time payment session with price_data (dynamic pricing for courses)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `${course_name} Course Enrollment`,
              description: `Enrollment at ${center_name} center. Preferred timing: ${preferred_time || 'Not specified'}`,
              metadata: {
                course_id,
                center_id,
                student_name: name,
                student_phone: phone,
              }
            },
            unit_amount: Math.round(amount * 100), // Convert to paise
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&course=${encodeURIComponent(course_name)}&center=${encodeURIComponent(center_name)}`,
      cancel_url: `${req.headers.get("origin")}/?payment=cancelled`,
      metadata: {
        student_name: name,
        student_phone: phone,
        student_email: email || "",
        course_id,
        center_id,
        preferred_time: preferred_time || "",
        course_name,
        center_name,
      },
      payment_intent_data: {
        metadata: {
          student_name: name,
          student_phone: phone,
          course_id,
          center_id,
        }
      }
    });

    console.log("Stripe session created:", session.id);

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error creating payment session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
