import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CustomersPage from "./pages/CustomersPage";
import ImportPage from "./pages/ImportPage";
import CampaignsPage from "./pages/CampaignsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import NpsNewPage from "./pages/NpsNewPage";
import NpsYearPage from "./pages/NpsYearPage";
import SurveyPage from "./pages/SurveyPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/NPS">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/customers" element={<CustomersPage />} />
          <Route path="/dashboard/import" element={<ImportPage />} />
          <Route path="/dashboard/campaigns" element={<CampaignsPage />} />
          <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
          <Route path="/dashboard/nps-new" element={<NpsNewPage />} />
          <Route path="/dashboard/nps-year" element={<NpsYearPage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
