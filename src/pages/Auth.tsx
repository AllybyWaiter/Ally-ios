import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Gift } from 'lucide-react';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeInput } from '@/lib/utils';
import { useRateLimit } from '@/hooks/useRateLimit';
import { logger } from '@/lib/logger';

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
  const [referralCode, setReferralCode] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [referralData, setReferralData] = useState<{ referralCodeId: string; referrerId: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string; referralCode?: string }>({});
  
  // Clear errors when switching views to prevent stale errors
  const handleViewChange = (newView: AuthView) => {
    setErrors({});
    setView(newView);
  };
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validationRequestIdRef = useRef<number>(0);

  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for referral code in URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      // Sanitize: only allow alphanumeric and hyphens, max 20 chars
      const sanitizedCode = refCode.replace(/[^A-Za-z0-9-]/g, '').slice(0, 20).toUpperCase();
      if (sanitizedCode) {
        setReferralCode(sanitizedCode);
        setView('signup');
        // Validate the code
        validateReferralCode(sanitizedCode);
      }
    }
  }, [searchParams]);

  const validateReferralCode = (code: string) => {
    // Clear previous timeout to debounce rapid typing
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    if (!code || code.length < 10) return;

    // Debounce validation by 500ms
    validationTimeoutRef.current = setTimeout(async () => {
      const requestId = ++validationRequestIdRef.current;

      try {
        const { data, error } = await supabase.functions.invoke('validate-referral-code', {
          body: { code },
        });

        // Ignore stale responses from previous requests
        if (requestId !== validationRequestIdRef.current) return;

        if (error || !data?.valid) {
          setReferrerName('');
          setReferralData(null);
          setErrors(prev => ({ ...prev, referralCode: 'Invalid referral code' }));
          return;
        }

        setReferrerName(data.referrer_name || 'a friend');
        setReferralData({
          referralCodeId: data.referral_code_id,
          referrerId: data.referrer_id,
        });
        setErrors(prev => ({ ...prev, referralCode: '' }));
      } catch {
        // Ignore stale responses
        if (requestId !== validationRequestIdRef.current) return;
        setReferrerName('');
        setReferralData(null);
      }
    }, 500);
  };

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

  // Cleanup subscription on unmount and redirect if logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    
    return () => {
      // Cleanup referral subscription on unmount
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [user, navigate]);
  
  // Timeout fallback for stuck authentication state
  useEffect(() => {
    if (!isAuthenticating) return;
    
    let mounted = true;
    
    const timeout = setTimeout(async () => {
      if (!mounted) return;
      
      // Fallback: check session directly and force navigate
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (session?.user) {
          navigate('/dashboard');
        } else {
          setIsAuthenticating(false);
          setIsLoading(false);
        }
      } catch (error) {
        logger.error('Auth timeout check failed:', error);
        if (mounted) {
          setIsAuthenticating(false);
          setIsLoading(false);
        }
      }
    }, 3000);
    
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
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
        // Create referral record after auth state is confirmed
        if (referralData) {
          // Use auth state change listener to ensure user is fully created
          const createReferral = async (userId: string) => {
            try {
              const { error: refInsertError } = await supabase.from('referrals').insert({
                referrer_id: referralData.referrerId,
                referee_id: userId,
                referral_code_id: referralData.referralCodeId,
                status: 'pending',
              });
              if (refInsertError) {
                logger.error('Failed to create referral record:', refInsertError);
              }
            } catch (refError) {
              logger.error('Failed to create referral record:', refError);
            }
          };
          
          // Listen for auth state change to get confirmed user
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              createReferral(session.user.id);
              subscription.unsubscribe();
              subscriptionRef.current = null;
            }
          });

          // Store subscription cleanup for unmount
          subscriptionRef.current = subscription;

          // Auto-cleanup subscription after 10 seconds to prevent memory leak
          setTimeout(() => {
            if (subscriptionRef.current === subscription) {
              subscription.unsubscribe();
              subscriptionRef.current = null;
            }
          }, 10000);
        }

        toast({
          title: 'Success',
          description: 'Account created successfully!',
        });
        
        // Track signup conversion
        if (typeof window !== 'undefined') {
          // GA4 signup event
          if (window.gtag) {
            window.gtag('event', 'sign_up', { method: 'email' });
          }
          // Meta Pixel registration event
          if (window.fbq) {
            window.fbq('track', 'CompleteRegistration');
          }
        }
      }
      
      resetRateLimit();
      // Don't navigate manually - let the useEffect handle it when user state updates
      // Keep authenticating state to show "Redirecting..." and prevent form flash
      setIsAuthenticating(true);
      return; // Exit early, don't set isLoading to false
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as 'name' | 'email' | 'password' | 'confirmPassword'] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        // Handle suspension and ban errors prominently
        if (errorMessage.includes('suspended') || errorMessage.includes('banned')) {
          toast({
            title: 'Account Access Restricted',
            description: errorMessage,
            variant: 'destructive',
            duration: 10000, // Show for longer
          });
        } else if (errorMessage.includes('Invalid login credentials')) {
          toast({
            title: 'Error',
            description: 'Invalid email or password',
            variant: 'destructive',
          });
        } else if (errorMessage.includes('User already registered')) {
          toast({
            title: 'Error',
            description: 'An account with this email already exists',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: errorMessage,
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
                    handleViewChange('login');
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
                    onClick={() => handleViewChange('login')}
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
                      maxLength={100}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                    />
                    {errors.name && (
                      <p id="name-error" className="text-sm text-destructive">{errors.name}</p>
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
                        onClick={() => handleViewChange('forgotPassword')}
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
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                  <div className="space-y-2">
                    <Label htmlFor="referralCode" className="flex items-center gap-2">
                      <Gift size={14} className="text-primary" />
                      Referral Code (optional)
                    </Label>
                    <Input
                      id="referralCode"
                      type="text"
                      placeholder="ALLY-XXXXXX"
                      value={referralCode}
                      onChange={(e) => {
                        const code = e.target.value.toUpperCase();
                        setReferralCode(code);
                        if (code.length >= 10) {
                          validateReferralCode(code);
                        } else {
                          setReferrerName('');
                        }
                      }}
                      disabled={isLoading}
                      className="uppercase"
                    />
                    {referrerName && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <Gift size={12} />
                        Referred by {referrerName} — you'll both get 1 month free!
                      </p>
                    )}
                    {errors.referralCode && (
                      <p className="text-sm text-destructive">{errors.referralCode}</p>
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
                  onClick={() => handleViewChange(view === 'login' ? 'signup' : 'login')}
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
