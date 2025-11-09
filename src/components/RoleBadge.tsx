import { Badge } from '@/components/ui/badge';
import { Shield, UserCog, Edit, Eye, User } from 'lucide-react';

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export const RoleBadge = ({ role, className }: RoleBadgeProps) => {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          icon: Shield,
          variant: 'destructive' as const,
          label: 'Admin'
        };
      case 'moderator':
        return {
          icon: UserCog,
          variant: 'default' as const,
          label: 'Moderator'
        };
      case 'editor':
        return {
          icon: Edit,
          variant: 'secondary' as const,
          label: 'Editor'
        };
      case 'viewer':
        return {
          icon: Eye,
          variant: 'outline' as const,
          label: 'Viewer'
        };
      default:
        return {
          icon: User,
          variant: 'outline' as const,
          label: 'User'
        };
    }
  };

  const config = getRoleConfig(role);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};
