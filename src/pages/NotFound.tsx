import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
        <p className="mb-2 text-xl text-muted-foreground">
          {t('errors.pageNotFound', 'Page not found')}
        </p>
        <p className="mb-6 text-muted-foreground">
          {t('errors.pageNotFoundDescription', "The page you're looking for doesn't exist or has been moved.")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.goBack', 'Go Back')}
          </Button>
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              {t('common.returnHome', 'Return Home')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
