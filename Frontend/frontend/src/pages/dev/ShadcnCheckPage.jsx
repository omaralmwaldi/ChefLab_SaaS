import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Scratch view to verify shadcn primitives render in the ChefLab brand palette
// (orange accent + stone neutrals). Not linked in nav; remove once the
// dashboard redesign consumes these primitives directly.
export default function ShadcnCheckPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>shadcn brand check</CardTitle>
          <CardDescription>
            Card, badge, separator and select in brand colours.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Badge>Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
          <Separator />
          <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Primary button
          </button>
          <Select>
            <SelectTrigger className="w-50">
              <SelectValue placeholder="Pick a recipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Recipe A</SelectItem>
              <SelectItem value="b">Recipe B</SelectItem>
              <SelectItem value="c">Recipe C</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
