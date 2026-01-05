import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home, PlusCircle, Calendar, User, BookOpen, LogIn, Shield, List } from "lucide-react";

const pages = [
  {
    title: "Home",
    route: "/",
    description: "Landing page with hero section, features overview, and call-to-action",
    icon: Home,
  },
  {
    title: "Create Event",
    route: "/create",
    description: "Multi-step wizard for creating new events with date and location options",
    icon: PlusCircle,
  },
  {
    title: "Event Page",
    route: "/event/:id",
    description: "Full event view with voting sections, participants, and collaboration tools",
    icon: Calendar,
  },
  {
    title: "My Events",
    route: "/my-events",
    description: "User's personal event dashboard showing created and joined events",
    icon: List,
  },
  {
    title: "Account",
    route: "/account",
    description: "User profile settings and preferences management",
    icon: User,
  },
  {
    title: "Guides",
    route: "/guides",
    description: "Help center with categorized articles and tutorials",
    icon: BookOpen,
  },
  {
    title: "Auth",
    route: "/auth",
    description: "Authentication page with login and signup forms",
    icon: LogIn,
  },
  {
    title: "Privacy Policy",
    route: "/privacy",
    description: "Legal privacy policy and data handling information",
    icon: Shield,
  },
];

export const PagePreviews = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {pages.map((page) => {
        const Icon = page.icon;
        const isViewable = !page.route.includes(":id");
        
        return (
          <Card key={page.route} className="overflow-hidden">
            <div className="bg-muted h-32 flex items-center justify-center border-b border-border">
              <Icon className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{page.title}</CardTitle>
              <CardDescription className="text-xs font-mono">
                {page.route}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {page.description}
              </p>
              {isViewable ? (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={page.route}>View Page</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Requires Event ID
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
