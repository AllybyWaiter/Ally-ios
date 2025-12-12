import React, { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Fish, Bug, Flower2, HelpCircle, Activity } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import type { Livestock } from "@/infrastructure/queries/livestock";

const categoryIcons = {
  fish: Fish,
  invertebrate: Bug,
  coral: Flower2,
  other: HelpCircle,
};

const healthColors = {
  healthy: 'default',
  sick: 'destructive',
  quarantine: 'secondary',
} as const;

interface LivestockCardProps {
  livestock: Livestock;
  onEdit: (livestock: Livestock) => void;
  onDelete: (id: string) => void;
}

export const LivestockCard = memo(function LivestockCard({
  livestock,
  onEdit,
  onDelete,
}: LivestockCardProps) {
  const Icon = categoryIcons[livestock.category as keyof typeof categoryIcons] || HelpCircle;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{livestock.name}</CardTitle>
              <CardDescription className="text-sm truncate">
                {livestock.species}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(livestock)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(livestock.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Quantity</span>
          <Badge variant="outline">{livestock.quantity}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Health</span>
          <Badge variant={healthColors[livestock.health_status as keyof typeof healthColors]} className="capitalize">
            <Activity className="mr-1 h-3 w-3" />
            {livestock.health_status}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Added</span>
          <span className="font-medium">{formatDate(livestock.date_added, 'PP')}</span>
        </div>
        {livestock.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t">
            {livestock.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
});
