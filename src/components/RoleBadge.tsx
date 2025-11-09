import { Badge } from '@/components/ui/badge';
import { Shield, UserCog, Edit, Eye, User } from 'lucide-react';

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export const RoleBadge = ({ role, className }: RoleBadgeProps) => {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'super_admin':
        return {
          icon: Shield,
          variant: 'destructive' as const,
          label: 'Super Admin',
          className: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0'
        };
      case 'admin':
        return {
          icon: Shield,
          variant: 'destructive' as const,
          label: 'Admin',
          className: ''
        };
      case 'moderator':
        return {
          icon: UserCog,
          variant: 'default' as const,
          label: 'Moderator',
          className: ''
        };
      case 'editor':
        return {
          icon: Edit,
          variant: 'secondary' as const,
          label: 'Editor',
          className: ''
        };
      case 'viewer':
        return {
          icon: Eye,
          variant: 'outline' as const,
          label: 'Viewer',
          className: ''
        };
      default:
        return {
          icon: User,
          variant: 'outline' as const,
          label: 'User',
          className: ''
        };
    }
  };

  const config = getRoleConfig(role);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${className || ''}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};
