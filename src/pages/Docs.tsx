import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComponentShowcase } from "@/components/docs/ComponentShowcase";
import { PagePreviews } from "@/components/docs/PagePreviews";
import { ColorPalette } from "@/components/docs/ColorPalette";
import { TypographyScale } from "@/components/docs/TypographyScale";

const Docs = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            UI Component Library
          </h1>
          <p className="text-muted-foreground">
            Visual documentation for easy screenshotting and sharing
          </p>
        </div>

        <Tabs defaultValue="components" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
          </TabsList>

          <TabsContent value="components">
            <ComponentShowcase />
          </TabsContent>

          <TabsContent value="pages">
            <PagePreviews />
          </TabsContent>

          <TabsContent value="colors">
            <ColorPalette />
          </TabsContent>

          <TabsContent value="typography">
            <TypographyScale />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Docs;
