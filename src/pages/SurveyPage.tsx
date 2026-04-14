import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCustomerByToken, getSurveyByType, determineSurveyType, submitSurveyResponse } from "@/lib/supabase-helpers";
import alramzLogo from "@/assets/alramz-logo.png";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Home, Building2, Hash } from "lucide-react";

type Question = {
  id: string;
  question_text: string;
  question_type: string;
  order_index: number;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  project_name: string | null;
  unit_number: string | null;
  building_number: string | null;
  delivery_date: string | null;
  has_responded: boolean;
  token: string;
};

const NPS_NEW_COLUMN_MAP: Record<number, string> = {
  0: "nps_score", 1: "satisfaction_score", 2: "sales_score", 3: "delivery_commitment_score", 4: "documents_received", 5: "finishing_notes_score", 6: "engineer_score", 7: "maintenance_score", 8: "open_feedback"
};

const NPS_YEAR_COLUMN_MAP: Record<number, string> = {
  0: "nps_score", 1: "delivery_commitment_score", 2: "documents_received", 3: "finishing_quality_score", 4: "engineer_score", 5: "maintenance_score", 6: "maintenance_speed_score", 7: "communication_score", 8: "transparency_score", 9: "community_score", 10: "open_feedback"
};

export default function SurveyPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const campaignId = params.get("campaign");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [surveyType, setSurveyType] = useState<"new" | "after_year">("new");
  const [surveyId, setSurveyId] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setError("رابط غير صالح"); setLoading(false); return; }
    (async () => {
      try {
        const c = await getCustomerByToken(token);
        if (!c) { setError("لم يتم العثور على العميل"); setLoading(false); return; }
        if (c.has_responded) { setSubmitted(true); setLoading(false); return; }
        setCustomer(c as Customer);

        const type = determineSurveyType(c.delivery_date);
        setSurveyType(type);
        const survey = await getSurveyByType(type);
        if (!survey) { setError("لا يوجد استبيان متاح"); setLoading(false); return; }
        setSurveyId(survey.id);
        const sorted = [...(survey.questions as Question[])].sort((a, b) => a.order_index - b.order_index);
        setQuestions(sorted);
        setLoading(false);

        await supabase.from("survey_tracking" as any).insert({
          customer_id: c.id, customer_name: c.name, project_name: c.project_name, event_type: 'visit'
        });
      } catch (err) { console.error(err); setError("حدث خطأ"); setLoading(false); }
    })();
  }, [token]);

  useEffect(() => {
    const handleUnload = () => {
      if (customer && !submitted) {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/survey_tracking`;
        const body = JSON.stringify({
          customer_id: customer.id,
          customer_name: customer.name,
          project_name: customer.project_name,
          event_type: 'left',
          timestamp: new Date().toISOString()
        });
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: body,
          keepalive: true
        });
      }
    };

    window.addEventListener("pagehide", handleUnload);
    return () => window.removeEventListener("pagehide", handleUnload);
  }, [customer, submitted]);

  const handleSubmit = async () => {
    if (!customer || !surveyId) return;
    setLoading(true);
    try {
      const ansArr = Object.entries(answers).map(([questionId, value]) => ({ questionId, value }));
      await submitSurveyResponse(customer.id, surveyId, ansArr, campaignId || undefined);

      const columnMap = surveyType === "new" ? NPS_NEW_COLUMN_MAP : NPS_YEAR_COLUMN_MAP;
      const tableName = surveyType === "new" ? "nps_new_responses" : "nps_after_year_responses";
      const npsRow: Record<string, any> = {
        timestamp: new Date().toISOString(),
        customer_name: customer.name,
        phone: customer.phone,
        project_name: customer.project_name,
        building_number: customer.building_number,
        unit_number: customer.unit_number,
        match_status: "مكتمل من العميل",
      };

      questions.forEach((q, idx) => {
        const col = columnMap[idx];
        if (col && answers[q.id] !== undefined) {
          const val = answers[q.id];
          if (["nps_score", "satisfaction_score", "sales_score", "delivery_commitment_score", "finishing_notes_score", "engineer_score", "maintenance_score", "finishing_quality_score", "maintenance_speed_score", "communication_score", "transparency_score", "community_score"].includes(col)) {
            npsRow[col] = parseInt(val) || 0;
          } else npsRow[col] = val;
        }
      });
      await supabase.from(tableName as any).insert(npsRow);
      await supabase.from("customers").update({ has_responded: true }).eq("id", customer.id);

      if (campaignId) {
        await supabase.from("campaign_recipients").update({ responded: true }).eq("customer_id", customer.id).eq("campaign_id", campaignId);
      }

      await supabase.from("survey_tracking" as any).insert({
        customer_id: customer.id, customer_name: customer.name, project_name: customer.project_name, event_type: 'complete'
      });

      setSubmitted(true);
    } catch (e) { console.error(e); setError("حدث خطأ أثناء الإرسال"); }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gradient-warm">
      <div className="text-primary font-bold animate-pulse">جاري التحميل...</div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center gradient-warm text-center p-10">
      <div className="bg-white/80 backdrop-blur-lg p-10 rounded-[3rem] shadow-2xl border border-white animate-fade-in space-y-6">
        <img src={alramzLogo} alt="الرمز" className="h-16 mx-auto mb-4" />
        <div className="text-6xl">✨</div>
        <h2 className="text-3xl font-black text-primary">تم الاستلام بنجاح!</h2>
        <p className="text-muted-foreground">شكراً لك {customer?.name}، رأيك يصنع الفرق.</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center gradient-warm text-center">
      <p className="text-muted-foreground font-bold">{error}</p>
    </div>
  );

  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const currentQ = currentIndex >= 0 ? questions[currentIndex] : null;

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      <div className="p-6 flex items-center justify-between sticky top-0 bg-white/10 backdrop-blur-md z-50">
        <img src={alramzLogo} alt="الرمز" className="h-10" />
        {currentIndex >= 0 && (
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-bold text-primary mb-1">{Math.round(progress)}% مكتمل</span>
             <Progress value={progress} className="w-24 h-1" />
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
         {currentIndex === -1 ? (
           <div className="w-full max-w-lg bg-white/40 backdrop-blur-xl p-8 md:p-12 rounded-[3.5rem] border border-white shadow-2xl space-y-8 animate-fade-in">
              <div className="text-center space-y-4">
                 <h1 className="text-4xl font-black text-primary leading-tight">شريكنا الاستراتيجي للنجاح</h1>
                 <p className="text-muted-foreground font-medium">نرجو التأكد من صحة بياناتك قبل البدء</p>
              </div>

              {customer && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <DataShow icon={User} label="الاسم" value={customer.name} />
                   <DataShow icon={Phone} label="الجوال" value={customer.phone} />
                   <DataShow icon={Home} label="المشروع" value={customer.project_name || "-"} />
                   <div className="flex gap-4 col-span-1 md:col-span-2">
                     <DataShow icon={Building2} label="المبنى" value={customer.building_number || "-"} className="flex-1" />
                     <DataShow icon={Hash} label="الوحدة" value={customer.unit_number || "-"} className="flex-1" />
                   </div>
                </div>
              )}

              <Button size="lg" className="w-full py-8 text-xl font-black rounded-3xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all" onClick={async () => {
                setCurrentIndex(0);
                if (customer) {
                   await supabase.from("survey_tracking" as any).insert({
                     customer_id: customer.id, customer_name: customer.name, project_name: customer.project_name, event_type: 'start'
                   });
                }
              }}>
                ابدأ الآن
              </Button>
           </div>
         ) : currentQ ? (
           <div className="w-full max-w-md space-y-8 animate-slide-in">
              <div className="space-y-4 text-center">
                 <Badge className="rounded-full px-4 py-1 bg-primary/10 text-primary border-none">سؤال {currentIndex + 1} من {questions.length}</Badge>
                 <h2 className="text-2xl font-bold leading-relaxed">{currentQ.question_text}</h2>
              </div>

              <div className="bg-white/70 p-8 rounded-[3rem] shadow-xl border border-white/50 min-h-[200px] flex flex-col justify-center">
                 {currentQ.question_type === "nps" && <NPSInput value={answers[currentQ.id]} onChange={(v) => { setAnswers({...answers, [currentQ.id]: v}); if(currentIndex < questions.length-1) setTimeout(() => setCurrentIndex(currentIndex+1), 300); }} />}
                 {currentQ.question_type === "csat" && <CSATInput value={answers[currentQ.id]} onChange={(v) => { setAnswers({...answers, [currentQ.id]: v}); if(currentIndex < questions.length-1) setTimeout(() => setCurrentIndex(currentIndex+1), 400); }} />}
                 {currentQ.question_type === "yes_no" && <YesNoInput value={answers[currentQ.id]} onChange={(v) => { setAnswers({...answers, [currentQ.id]: v}); if(currentIndex < questions.length-1) setTimeout(() => setCurrentIndex(currentIndex+1), 400); }} />}
                 {currentQ.question_type === "text" && <Textarea value={answers[currentQ.id] || ""} onChange={(e) => setAnswers({...answers, [currentQ.id]: e.target.value})} placeholder="رأيك يهمنا..." className="min-h-[150px] text-right rounded-2xl bg-white border-primary/5 shadow-inner" />}
              </div>

              <div className="flex gap-4">
                {currentIndex > 0 && <Button variant="outline" className="flex-1 py-6 rounded-2xl font-bold" onClick={() => setCurrentIndex(currentIndex - 1)}>السابق</Button>}
                {currentIndex === questions.length - 1 ? (
                   <Button className="flex-[2] py-8 text-xl font-bold rounded-2xl shadow-lg" onClick={handleSubmit} disabled={loading}>إرسال الاستبيان</Button>
                ) : (
                  <Button className="flex-[2] py-8 rounded-2xl font-bold" onClick={() => setCurrentIndex(currentIndex + 1)} disabled={!answers[currentQ.id] && currentQ.question_type !== "text"}>التالي</Button>
                )}
              </div>
           </div>
         ) : null}
      </div>
    </div>
  );
}

function DataShow({ icon: Icon, label, value, className = "" }: { icon: any; label: string; value: string; className?: string }) {
  return (
    <div className={`bg-white/60 p-4 rounded-2xl border border-white flex items-center justify-between text-right ${className} shadow-sm`}>
       <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground font-bold">{label}</span>
          <span className="font-bold text-sm">{value}</span>
       </div>
       <Icon className="w-5 h-5 text-primary/40" />
    </div>
  );
}

function NPSInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-[9px] font-black px-1"><span className="text-green-600">مرجح جداً</span> <span className="text-red-500">غير مرجح</span></div>
      <div className="grid grid-cols-11 gap-1 direction-rtl">
        {Array.from({ length: 11 }, (_, i) => (
          <button key={i} onClick={() => onChange(String(i))} className={`aspect-square rounded-lg text-xs font-black transition-all ${value === String(i) ? "bg-primary text-primary-foreground scale-110 shadow-lg ring-2 ring-primary/20" : "bg-white border border-slate-100 hover:bg-slate-50"}`}>{i}</button>
        ))}
      </div>
    </div>
  );
}

function CSATInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const emojis = ["😞", "😕", "😐", "😊", "😍"];
  return (
    <div className="grid grid-cols-5 gap-2">
       {emojis.map((emoji, i) => (
         <button key={i} onClick={() => onChange(String(i+1))} className={`p-4 rounded-2xl text-2xl transition-all ${value === String(i+1) ? "bg-primary text-white scale-105 shadow-xl" : "bg-white hover:bg-slate-50"}`}>{emoji}</button>
       ))}
    </div>
  );
}

function YesNoInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
       {[{v: "yes", label: "نعم", e: "✅"}, {v:"no", label: "لا", e: "❌"}].map(opt => (
         <button key={opt.v} onClick={() => onChange(opt.v)} className={`flex flex-col items-center p-6 rounded-[2rem] transition-all ${value === opt.v ? "bg-primary text-white scale-105 shadow-xl" : "bg-white border border-slate-100"}`}>
            <span className="text-3xl mb-2">{opt.e}</span><span className="font-black text-sm">{opt.label}</span>
         </button>
       ))}
    </div>
  );
}
