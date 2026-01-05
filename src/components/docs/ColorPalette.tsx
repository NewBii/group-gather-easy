import { Separator } from "@/components/ui/separator";

interface ColorSwatchProps {
  name: string;
  variable: string;
  hsl: string;
  className: string;
}

const ColorSwatch = ({ name, variable, hsl, className }: ColorSwatchProps) => (
  <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
    <div className={`w-full h-16 rounded-md mb-3 border border-border ${className}`} />
    <p className="font-medium text-sm text-foreground">{name}</p>
    <p className="text-xs text-muted-foreground font-mono">{variable}</p>
    <p className="text-xs text-muted-foreground">{hsl}</p>
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="col-span-full mb-2 mt-8 first:mt-0">
    <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    <Separator className="mt-2" />
  </div>
);

export const ColorPalette = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {/* Primary Colors */}
      <SectionHeader title="Primary Colors" />
      
      <ColorSwatch
        name="Primary"
        variable="--primary"
        hsl="11 59% 56%"
        className="bg-primary"
      />
      <ColorSwatch
        name="Primary Foreground"
        variable="--primary-foreground"
        hsl="0 0% 100%"
        className="bg-primary-foreground"
      />

      {/* Background Colors */}
      <SectionHeader title="Background Colors" />
      
      <ColorSwatch
        name="Background"
        variable="--background"
        hsl="30 20% 98%"
        className="bg-background"
      />
      <ColorSwatch
        name="Foreground"
        variable="--foreground"
        hsl="30 10% 15%"
        className="bg-foreground"
      />
      <ColorSwatch
        name="Card"
        variable="--card"
        hsl="0 0% 100%"
        className="bg-card"
      />
      <ColorSwatch
        name="Card Foreground"
        variable="--card-foreground"
        hsl="30 10% 15%"
        className="bg-card-foreground"
      />

      {/* Secondary & Muted Colors */}
      <SectionHeader title="Secondary & Muted" />
      
      <ColorSwatch
        name="Secondary"
        variable="--secondary"
        hsl="30 15% 93%"
        className="bg-secondary"
      />
      <ColorSwatch
        name="Secondary Foreground"
        variable="--secondary-foreground"
        hsl="30 10% 25%"
        className="bg-secondary-foreground"
      />
      <ColorSwatch
        name="Muted"
        variable="--muted"
        hsl="30 10% 94%"
        className="bg-muted"
      />
      <ColorSwatch
        name="Muted Foreground"
        variable="--muted-foreground"
        hsl="30 10% 45%"
        className="bg-muted-foreground"
      />

      {/* Accent Colors */}
      <SectionHeader title="Accent Colors" />
      
      <ColorSwatch
        name="Accent"
        variable="--accent"
        hsl="11 59% 56%"
        className="bg-accent"
      />
      <ColorSwatch
        name="Accent Foreground"
        variable="--accent-foreground"
        hsl="0 0% 100%"
        className="bg-accent-foreground"
      />

      {/* Semantic Colors */}
      <SectionHeader title="Semantic Colors" />
      
      <ColorSwatch
        name="Destructive"
        variable="--destructive"
        hsl="0 72% 51%"
        className="bg-destructive"
      />
      <ColorSwatch
        name="Success"
        variable="--success"
        hsl="142 76% 36%"
        className="bg-[hsl(142,76%,36%)]"
      />
      <ColorSwatch
        name="Warning"
        variable="--warning"
        hsl="38 92% 50%"
        className="bg-[hsl(38,92%,50%)]"
      />

      {/* UI Colors */}
      <SectionHeader title="UI Colors" />
      
      <ColorSwatch
        name="Border"
        variable="--border"
        hsl="30 15% 88%"
        className="bg-border"
      />
      <ColorSwatch
        name="Input"
        variable="--input"
        hsl="30 15% 88%"
        className="bg-input"
      />
      <ColorSwatch
        name="Ring"
        variable="--ring"
        hsl="11 59% 56%"
        className="bg-ring"
      />
    </div>
  );
};
