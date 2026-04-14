import { Link } from "react-router-dom";
import alramzLogo from "@/assets/alramz-logo.png";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen gradient-warm flex flex-col items-center justify-center p-8 text-center" dir="rtl">
      <div className="animate-fade-in space-y-8 max-w-md">
        <img src={alramzLogo} alt="الرمز" className="h-20 mx-auto" />
        <h1 className="text-4xl font-bold">راحة تغنيك</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          نظام إدارة استبيانات رضا العملاء
        </p>
        <Link to="/dashboard">
          <Button size="lg" className="text-lg py-6 px-8">
            <LayoutDashboard className="h-5 w-5 ml-2" />
            لوحة التحكم
          </Button>
        </Link>
      </div>
    </div>
  );
}
