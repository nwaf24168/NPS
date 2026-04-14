import { supabase } from "@/integrations/supabase/client";

export async function getCustomerByToken(token: string) {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSurveyByType(type: "new" | "after_year") {
  const { data, error } = await supabase
    .from("surveys")
    .select("*, questions(*)")
    .eq("type", type)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function determineSurveyType(deliveryDate: string | null): "new" | "after_year" {
  if (!deliveryDate) return "new";
  const delivery = new Date(deliveryDate);
  const now = new Date();
  const diffDays = (now.getTime() - delivery.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays < 365 ? "new" : "after_year";
}

export async function submitSurveyResponse(
  customerId: string,
  surveyId: string,
  answers: { questionId: string; value: string }[],
  campaignId?: string
) {
  const { data: response, error: respError } = await supabase
    .from("responses")
    .insert({
      customer_id: customerId,
      survey_id: surveyId,
      campaign_id: campaignId || null,
    })
    .select()
    .single();
  if (respError) throw respError;

  const answerRows = answers.map((a) => ({
    response_id: response.id,
    question_id: a.questionId,
    answer_value: a.value,
  }));

  const { error: ansError } = await supabase.from("answers").insert(answerRows);
  if (ansError) throw ansError;

  await supabase
    .from("customers")
    .update({ has_responded: true })
    .eq("id", customerId);

  return response;
}

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("00966")) cleaned = "+" + cleaned.slice(2);
  if (cleaned.startsWith("966")) cleaned = "+" + cleaned;
  if (cleaned.startsWith("05")) cleaned = "+966" + cleaned.slice(1);
  if (cleaned.startsWith("5") && cleaned.length === 9) cleaned = "+966" + cleaned;
  return cleaned;
}
