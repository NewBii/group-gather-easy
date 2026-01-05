import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import CreateEvent from "./pages/CreateEvent";
import Guides from "./pages/Guides";
import GuideCategory from "./pages/GuideCategory";
import GuideArticle from "./pages/GuideArticle";
import AdminGuides from "./pages/AdminGuides";
import AdminArticleEditor from "./pages/AdminArticleEditor";
import Event from "./pages/Event";
import Auth from "./pages/Auth";
import MyEvents from "./pages/MyEvents";
import Account from "./pages/Account";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import Docs from "./pages/Docs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/create" element={<CreateEvent />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/guides/:category" element={<GuideCategory />} />
              <Route path="/guides/:category/:slug" element={<GuideArticle />} />
              <Route path="/admin/guides" element={<AdminGuides />} />
              <Route path="/admin/guides/:id" element={<AdminArticleEditor />} />
              <Route path="/event/:id" element={<Event />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/my-events" element={<MyEvents />} />
              <Route path="/account" element={<Account />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
