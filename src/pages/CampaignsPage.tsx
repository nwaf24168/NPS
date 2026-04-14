import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Survey = { id: string; name: string; type: string };
type Campaign = {
  id: string;
  name: string;
  survey_id: string;
  created_at: string;
  surveys?: { name: string };
  total?: number;
  responded?: number;
};
type Customer = { id: string; name: string; phone: string; project_name: string | null; has_responded: boolean };

export default function CampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newName, setNewName] = useState("");
  const [newSurvey, setNewSurvey] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadData = async () => {
    const { data: s } = await supabase.from("surveys").select("*");
    if (s) setSurveys(s as Survey[]);

    const { data: c } = await supabase.from("campaigns").select("*, surveys(name)").order("created_at", { ascending: false });
    if (c) {
      const withStats = await Promise.all(
        (c as Campaign[]).map(async (camp) => {
          const { count: total } = await supabase.from("campaign_recipients").select("*", { count: "exact", head: true }).eq("campaign_id", camp.id);
          const { count: responded } = await supabase.from("campaign_recipients").select("*", { count: "exact", head: true }).eq("campaign_id", camp.id).eq("responded", true);
          return { ...camp, total: total || 0, responded: responded || 0 };
        })
      );
      setCampaigns(withStats);
    }

    const { data: cust } = await supabase.from("customers").select("id, name, phone, project_name, has_responded");
    if (cust) setCustomers(cust as Customer[]);
  };

  useEffect(() => { loadData(); }, []);

  const createCampaign = async () => {
    if (!newName || !newSurvey || selectedCustomers.length === 0) return;
    const { data: campaign } = await supabase.from("campaigns").insert({ name: newName, survey_id: newSurvey }).select().single();
    if (!campaign) return;

    const recipients = selectedCustomers.map((cid) => ({
      campaign_id: campaign.id,
      customer_id: cid,
    }));
    await supabase.from("campaign_recipients").insert(recipients);

    toast({ title: "تم إنشاء الحملة", description: `تم إضافة ${selectedCustomers.length} مستلم` });
    setDialogOpen(false);
    setNewName("");
    setNewSurvey("");
    setSelectedCustomers([]);
    loadData();
  };

  const toggleCustomer = (id: string) => {
    setSelectedCustomers((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const selectAll = () => setSelectedCustomers(customers.map((c) => c.id));
  const selectNotResponded = () => setSelectedCustomers(customers.filter((c) => !c.has_responded).map((c) => c.id));

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">الحملات</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 ml-2" /> حملة جديدة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء حملة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="اسم الحملة" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Select value={newSurvey} onValueChange={setNewSurvey}>
                <SelectTrigger><SelectValue placeholder="اختر الاستبيان" /></SelectTrigger>
                <SelectContent>
                  {surveys.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>تحديد الكل</Button>
                <Button variant="outline" size="sm" onClick={selectNotResponded}>لم يستجيبوا فقط</Button>
              </div>

              <div className="max-h-48 overflow-y-auto border rounded-lg">
                {customers.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-secondary cursor-pointer">
                    <input type="checkbox" checked={selectedCustomers.includes(c.id)} onChange={() => toggleCustomer(c.id)} />
                    <span className="flex-1 text-sm">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.project_name}</span>
                  </label>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">تم تحديد {selectedCustomers.length} عميل</p>

              <Button className="w-full" onClick={createCampaign} disabled={!newName || !newSurvey || selectedCustomers.length === 0}>
                <Send className="h-4 w-4 ml-2" /> إنشاء الحملة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {campaigns.map((camp) => (
          <Card key={camp.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{camp.name}</h3>
                  <p className="text-sm text-muted-foreground">{camp.surveys?.name}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg">{camp.total}</div>
                    <div className="text-muted-foreground">مرسل</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-primary">{camp.responded}</div>
                    <div className="text-muted-foreground">استجابوا</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">
                      {camp.total ? Math.round(((camp.responded || 0) / camp.total) * 100) : 0}%
                    </div>
                    <div className="text-muted-foreground">نسبة الاستجابة</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {campaigns.length === 0 && (
          <p className="text-center text-muted-foreground py-12">لا توجد حملات بعد</p>
        )}
      </div>
    </DashboardLayout>
  );
}
