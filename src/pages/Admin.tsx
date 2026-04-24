import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mountain, LogOut, Loader2 } from "lucide-react";
import QuadsTab from "@/components/admin/QuadsTab";
import OffersTab from "@/components/admin/OffersTab";
import BookingsTab from "@/components/admin/BookingsTab";

const Admin = () => {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAdminAuth();

  useEffect(() => {
    if (!loading && !session) navigate("/auth");
  }, [loading, session, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-4xl">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">Your account doesn't have admin privileges.</p>
          <Button variant="outlineGlow" className="mt-6" onClick={signOut}>Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-primary text-primary-foreground"><Mountain className="h-5 w-5" /></span>
            <span className="font-display text-xl tracking-wider">AGAFAY ADMIN</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /> Sign out</Button>
        </div>
      </header>
      <div className="container mx-auto py-10">
        <Tabs defaultValue="bookings">
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="quads">Quads</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
          </TabsList>
          <TabsContent value="bookings" className="mt-8"><BookingsTab /></TabsContent>
          <TabsContent value="quads" className="mt-8"><QuadsTab /></TabsContent>
          <TabsContent value="offers" className="mt-8"><OffersTab /></TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default Admin;