import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Home, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const courseName = searchParams.get("course") || "Your Course";
  const centerName = searchParams.get("center") || "Our Center";
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-gradient-to-br from-success/10 via-background to-primary/10 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-elevated border-success/30">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-success/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
          
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Payment Successful! 🎉
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Your enrollment for <strong className="text-primary">{decodeURIComponent(courseName)}</strong> at <strong className="text-secondary">{decodeURIComponent(centerName)}</strong> has been confirmed.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left space-y-2">
            <p className="text-sm text-muted-foreground">
              ✅ Payment received successfully
            </p>
            <p className="text-sm text-muted-foreground">
              ✅ Confirmation email sent
            </p>
            <p className="text-sm text-muted-foreground">
              ✅ Enrollment registered
            </p>
            {sessionId && (
              <p className="text-xs text-muted-foreground mt-2 break-all">
                Transaction ID: {sessionId}
              </p>
            )}
          </div>

          <div className="bg-primary/10 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-foreground mb-2">Next Steps:</h3>
            <ul className="text-sm text-muted-foreground text-left space-y-1">
              <li>📱 You'll receive a WhatsApp confirmation shortly</li>
              <li>📧 Check your email for payment receipt</li>
              <li>🏢 Visit the center to complete formalities</li>
              <li>📚 Classes will begin as per schedule</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link to="/">
              <Button className="w-full gradient-primary">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            
            <a href="https://wa.me/919733089257" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full">
                <Phone className="w-4 h-4 mr-2" />
                Contact Us on WhatsApp
              </Button>
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Abbas Molla Computer</strong><br />
              📞 +91 97330 89257<br />
              📧 contact@abbasmolla.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
