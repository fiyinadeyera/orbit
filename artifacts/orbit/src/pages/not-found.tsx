import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex w-full min-h-[50vh] items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            This page does not exist, or it may have moved.
          </p>

          <Link href="/" className="mt-8 text-primary hover:underline block">
            Back to Orbit
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
