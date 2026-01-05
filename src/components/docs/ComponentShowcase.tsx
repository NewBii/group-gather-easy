import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertCircle, Check, Home, Settings, User } from "lucide-react";
import { useState } from "react";

const ComponentCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
    <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wide font-medium">
      {title}
    </p>
    {children}
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="col-span-full mb-2 mt-8 first:mt-0">
    <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    <Separator className="mt-2" />
  </div>
);

export const ComponentShowcase = () => {
  const [sliderValue, setSliderValue] = useState([50]);
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* Buttons Section */}
      <SectionHeader title="Buttons" />
      
      <ComponentCard title="Button - Default">
        <Button>Click me</Button>
      </ComponentCard>

      <ComponentCard title="Button - Destructive">
        <Button variant="destructive">Delete</Button>
      </ComponentCard>

      <ComponentCard title="Button - Outline">
        <Button variant="outline">Outline</Button>
      </ComponentCard>

      <ComponentCard title="Button - Secondary">
        <Button variant="secondary">Secondary</Button>
      </ComponentCard>

      <ComponentCard title="Button - Ghost">
        <Button variant="ghost">Ghost</Button>
      </ComponentCard>

      <ComponentCard title="Button - Link">
        <Button variant="link">Link</Button>
      </ComponentCard>

      <ComponentCard title="Button Sizes">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </ComponentCard>

      <ComponentCard title="Button - Disabled">
        <Button disabled>Disabled</Button>
      </ComponentCard>

      {/* Form Elements Section */}
      <SectionHeader title="Form Elements" />

      <ComponentCard title="Input - Default">
        <Input placeholder="Enter text..." />
      </ComponentCard>

      <ComponentCard title="Input - Disabled">
        <Input placeholder="Disabled input" disabled />
      </ComponentCard>

      <ComponentCard title="Textarea">
        <Textarea placeholder="Enter description..." />
      </ComponentCard>

      <ComponentCard title="Select">
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
            <SelectItem value="3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </ComponentCard>

      <ComponentCard title="Checkbox">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="check1" />
            <Label htmlFor="check1">Unchecked</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="check2" checked />
            <Label htmlFor="check2">Checked</Label>
          </div>
        </div>
      </ComponentCard>

      <ComponentCard title="Radio Group">
        <RadioGroup defaultValue="option-1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-1" id="r1" />
            <Label htmlFor="r1">Option 1</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-2" id="r2" />
            <Label htmlFor="r2">Option 2</Label>
          </div>
        </RadioGroup>
      </ComponentCard>

      <ComponentCard title="Switch">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch id="switch1" />
            <Label htmlFor="switch1">Off</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="switch2" checked />
            <Label htmlFor="switch2">On</Label>
          </div>
        </div>
      </ComponentCard>

      <ComponentCard title="Slider">
        <Slider
          value={sliderValue}
          onValueChange={setSliderValue}
          max={100}
          step={1}
        />
      </ComponentCard>

      {/* Feedback Section */}
      <SectionHeader title="Feedback" />

      <ComponentCard title="Alert - Default">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Note</AlertTitle>
          <AlertDescription>This is an informational alert.</AlertDescription>
        </Alert>
      </ComponentCard>

      <ComponentCard title="Alert - Destructive">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong.</AlertDescription>
        </Alert>
      </ComponentCard>

      <ComponentCard title="Badge Variants">
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </ComponentCard>

      <ComponentCard title="Progress">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">0%</p>
            <Progress value={0} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">50%</p>
            <Progress value={50} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">100%</p>
            <Progress value={100} />
          </div>
        </div>
      </ComponentCard>

      <ComponentCard title="Skeleton">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </ComponentCard>

      {/* Layout Section */}
      <SectionHeader title="Layout" />

      <ComponentCard title="Card">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-base">Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm">Card content goes here.</p>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button size="sm">Action</Button>
          </CardFooter>
        </Card>
      </ComponentCard>

      <ComponentCard title="Accordion">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-sm">Section 1</AccordionTrigger>
            <AccordionContent>Content for section 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-sm">Section 2</AccordionTrigger>
            <AccordionContent>Content for section 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      </ComponentCard>

      <ComponentCard title="Tabs">
        <Tabs defaultValue="tab1" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="tab1" className="flex-1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" className="flex-1">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="mt-2">
            <p className="text-sm text-muted-foreground">Tab 1 content</p>
          </TabsContent>
          <TabsContent value="tab2" className="mt-2">
            <p className="text-sm text-muted-foreground">Tab 2 content</p>
          </TabsContent>
        </Tabs>
      </ComponentCard>

      <ComponentCard title="Separator">
        <div className="space-y-2">
          <p className="text-sm">Above separator</p>
          <Separator />
          <p className="text-sm">Below separator</p>
        </div>
      </ComponentCard>

      {/* Navigation Section */}
      <SectionHeader title="Navigation" />

      <ComponentCard title="Breadcrumb">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Category</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </ComponentCard>

      <ComponentCard title="Pagination">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </ComponentCard>

      {/* Data Display Section */}
      <SectionHeader title="Data Display" />

      <ComponentCard title="Avatar">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </ComponentCard>

      <ComponentCard title="Table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane</TableCell>
              <TableCell>Pending</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ComponentCard>

      <ComponentCard title="Calendar">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </div>
      </ComponentCard>
    </div>
  );
};
