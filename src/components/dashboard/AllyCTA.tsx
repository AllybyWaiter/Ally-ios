import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import logo from '@/assets/logo.png';

export function AllyCTA() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card className="mb-8 bg-gradient-primary border-none animate-fade-up opacity-0 hover:shadow-glow transition-shadow duration-300" style={{ animationDelay: '100ms' }}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center animate-float overflow-hidden">
              <img src={logo} alt="Ally" className="h-full w-full object-cover" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-foreground mb-1">
                {t('dashboard.chatWithAlly')}
              </h3>
              <p className="text-sm text-primary-foreground/80">
                {t('dashboard.chatDescription')}
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/chat')}
            variant="secondary"
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            {t('dashboard.startChat')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
