import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeInput } from '@/lib/utils';
import { useRateLimit } from '@/hooks/useRateLimit';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AuthView = 'login' | 'signup' | 'forgotPassword';

export default function Auth() {
  const [view, setView] = useState<AuthView>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { isRateLimited, checkRateLimit, resetRateLimit } = useRateLimit({
    maxAttempts: 5,
    windowMs: 300000, // 5 minutes
    onLimitExceeded: () => {
      toast({
        title: "Too many attempts",
        description: "Please wait 5 minutes before trying again.",
        variant: "destructive",
      });
    },
  });

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Timeout fallback for stuck authentication state
  useEffect(() => {
    if (!isAuthenticating) return;
    
    const timeout = setTimeout(async () => {
      // Fallback: check session directly and force navigate
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/dashboard');
      } else {
        setIsAuthenticating(false);
        setIsLoading(false);
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [isAuthenticating, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!checkRateLimit()) {
      return;
    }

    const sanitizedEmail = sanitizeInput(email);
    
    try {
      loginSchema.pick({ email: true }).parse({ email: sanitizedEmail });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors({ email: error.errors[0]?.message });
      }
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      setResetEmailSent(true);
      resetRateLimit();
      toast({
        title: 'Check your email',
        description: 'We sent you a password reset link.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to send reset email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Check rate limit
    if (!checkRateLimit()) {
      return;
    }

    setIsLoading(true);

    try {
      if (view === 'login') {
        const sanitizedEmail = sanitizeInput(email);
        const validated = loginSchema.parse({ email: sanitizedEmail, password });
        const { error } = await signIn(validated.email, validated.password);
        
        if (error) {
          throw error;
        }
      } else {
        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = sanitizeInput(email);
        const validated = signupSchema.parse({ 
          name: sanitizedName, 
          email: sanitizedEmail, 
          password, 
          confirmPassword 
        });
        
        const { error } = await signUp(validated.email, validated.password, validated.name);
        
        if (error) {
          throw error;
        }
      }

      if (view === 'signup') {
        toast({
          title: 'Success',
          description: 'Account created successfully!',
        });
      }
      
      resetRateLimit();
      // Don't navigate manually - let the useEffect handle it when user state updates
      // Keep authenticating state to show "Redirecting..." and prevent form flash
      setIsAuthenticating(true);
      return; // Exit early, don't set isLoading to false
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as 'name' | 'email' | 'password' | 'confirmPassword'] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else if (error?.message) {
        // Handle suspension and ban errors prominently
        if (error.message.includes('suspended') || error.message.includes('banned')) {
          toast({
            title: 'Account Access Restricted',
            description: error.message,
            variant: 'destructive',
            duration: 10000, // Show for longer
          });
        } else if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Error',
            description: 'Invalid email or password',
            variant: 'destructive',
          });
        } else if (error.message.includes('User already registered')) {
          toast({
            title: 'Error',
            description: 'An account with this email already exists',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <Link to="/" className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Ally Logo" className="w-12 h-12 object-contain" />
            <div className="text-center">
              <div className="font-bold text-2xl">Ally</div>
              <div className="text-xs text-muted-foreground">by WA.I.TER</div>
            </div>
          </Link>
          <div>
          <CardTitle className="text-2xl text-center">
              {view === 'login' ? 'Welcome Back' : view === 'signup' ? 'Create Account' : 'Reset Password'}
            </CardTitle>
            <CardDescription className="text-center">
              {view === 'login' 
                ? 'Sign in to your account' 
                : view === 'signup' 
                  ? 'Create your free account to get started'
                  : 'Enter your email to receive a reset link'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {view === 'forgotPassword' ? (
            resetEmailSent ? (
              <div className="text-center space-y-4">
                <div className="text-green-500 text-5xl mb-4">✓</div>
                <p className="text-muted-foreground">
                  Check your email for a password reset link. If you don't see it, check your spam folder.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setView('login');
                    setResetEmailSent(false);
                    setEmail('');
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || isRateLimited}>
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-sm text-primary hover:underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {view === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                      autoComplete="name"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {view === 'login' && (
                      <button
                        type="button"
                        onClick={() => setView('forgotPassword')}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="pr-10"
                      autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                  {view === 'signup' && (
                    <p className="text-xs text-muted-foreground">
                      Must be 8+ characters with uppercase, lowercase, and number
                    </p>
                  )}
                </div>
                {view === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        className="pr-10"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}
                {view === 'signup' && (
                  <p className="text-xs text-muted-foreground text-center">
                    By creating an account, you agree to our{' '}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>, and acknowledge our{' '}
                    <Link to="/cookies" className="text-primary hover:underline">
                      Cookie Policy
                    </Link>.
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading || isAuthenticating || isRateLimited}>
                  {isAuthenticating ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Redirecting...
                    </>
                  ) : isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {view === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    view === 'login' ? 'Sign In' : 'Sign Up'
                  )}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                <button
                  onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                  className="text-primary hover:underline"
                  disabled={isLoading}
                >
                  {view === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
