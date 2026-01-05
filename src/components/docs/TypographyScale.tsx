import { Separator } from "@/components/ui/separator";

const SectionHeader = ({ title }: { title: string }) => (
  <div className="col-span-full mb-2 mt-8 first:mt-0">
    <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    <Separator className="mt-2" />
  </div>
);

const TypographyCard = ({ 
  title, 
  specs, 
  children 
}: { 
  title: string; 
  specs: string; 
  children: React.ReactNode;
}) => (
  <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
    <div className="flex items-start justify-between gap-4 mb-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        {title}
      </p>
      <p className="text-xs text-muted-foreground font-mono whitespace-nowrap">
        {specs}
      </p>
    </div>
    {children}
  </div>
);

export const TypographyScale = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Headings */}
      <SectionHeader title="Headings" />
      
      <TypographyCard title="Heading 1" specs="2.25rem / 36px • Bold">
        <h1 className="text-4xl font-bold text-foreground">The quick brown fox</h1>
      </TypographyCard>

      <TypographyCard title="Heading 2" specs="1.875rem / 30px • Semibold">
        <h2 className="text-3xl font-semibold text-foreground">The quick brown fox</h2>
      </TypographyCard>

      <TypographyCard title="Heading 3" specs="1.5rem / 24px • Semibold">
        <h3 className="text-2xl font-semibold text-foreground">The quick brown fox</h3>
      </TypographyCard>

      <TypographyCard title="Heading 4" specs="1.25rem / 20px • Medium">
        <h4 className="text-xl font-medium text-foreground">The quick brown fox</h4>
      </TypographyCard>

      {/* Body Text */}
      <SectionHeader title="Body Text" />
      
      <TypographyCard title="Body Large" specs="1.125rem / 18px • Regular">
        <p className="text-lg text-foreground">
          The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
        </p>
      </TypographyCard>

      <TypographyCard title="Body Default" specs="1rem / 16px • Regular">
        <p className="text-base text-foreground">
          The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
        </p>
      </TypographyCard>

      <TypographyCard title="Body Small" specs="0.875rem / 14px • Regular">
        <p className="text-sm text-foreground">
          The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
        </p>
      </TypographyCard>

      <TypographyCard title="Caption" specs="0.75rem / 12px • Regular">
        <p className="text-xs text-foreground">
          The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
        </p>
      </TypographyCard>

      {/* Muted Text */}
      <SectionHeader title="Muted Text" />
      
      <TypographyCard title="Muted Body" specs="1rem / 16px • text-muted-foreground">
        <p className="text-base text-muted-foreground">
          The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
        </p>
      </TypographyCard>

      <TypographyCard title="Muted Small" specs="0.875rem / 14px • text-muted-foreground">
        <p className="text-sm text-muted-foreground">
          The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
        </p>
      </TypographyCard>

      {/* Font Weights */}
      <SectionHeader title="Font Weights" />
      
      <TypographyCard title="Regular (400)" specs="font-normal">
        <p className="text-lg font-normal text-foreground">The quick brown fox jumps over the lazy dog</p>
      </TypographyCard>

      <TypographyCard title="Medium (500)" specs="font-medium">
        <p className="text-lg font-medium text-foreground">The quick brown fox jumps over the lazy dog</p>
      </TypographyCard>

      <TypographyCard title="Semibold (600)" specs="font-semibold">
        <p className="text-lg font-semibold text-foreground">The quick brown fox jumps over the lazy dog</p>
      </TypographyCard>

      <TypographyCard title="Bold (700)" specs="font-bold">
        <p className="text-lg font-bold text-foreground">The quick brown fox jumps over the lazy dog</p>
      </TypographyCard>

      {/* Special Styles */}
      <SectionHeader title="Special Styles" />
      
      <TypographyCard title="Monospace" specs="font-mono">
        <p className="text-base font-mono text-foreground">const greeting = "Hello World";</p>
      </TypographyCard>

      <TypographyCard title="Tracking Wide" specs="tracking-wide uppercase">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Section Label</p>
      </TypographyCard>
    </div>
  );
};
