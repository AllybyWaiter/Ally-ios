import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useReferralCode } from '@/hooks/useReferralCode';
import {
  Copy,
  Gift,
  Users,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export function ReferralSection() {
  const { 
    referralCode, 
    stats, 
    isLoading, 
    copyCode, 
    copyShareUrl,
    getShareUrl 
  } = useReferralCode();

  const shareUrl = getShareUrl();

  const handleShare = async (platform: string) => {
    const text = `Join me on Ally! Use my referral code ${referralCode} and we both get 1 month of Plus free. 🐠`;
    const url = shareUrl;

    // Try native share API first for mobile
    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({ title: 'Join me on Ally!', text, url });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      email: `mailto:?subject=${encodeURIComponent('Join me on Ally!')}&body=${encodeURIComponent(text + '\n\n' + url)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
    } else {
      // Fallback: copy to clipboard for desktop
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success('Link copied to clipboard!');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Your Referral Code</CardTitle>
          </div>
          <CardDescription>
            Share your code and both you and your friend get 1 month of Plus free!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Code Display */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={referralCode || ''}
                readOnly
                className="font-mono text-lg font-bold text-center tracking-wider bg-background"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyCode}
              title="Copy code"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Share URL */}
          <div className="flex items-center gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="text-sm text-muted-foreground"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyShareUrl}
              title="Copy link"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => handleShare('facebook')}
              className="flex-1 min-w-[100px] justify-center bg-[#1877F2] hover:bg-[#0d65d9] text-white border-none"
            >
              Facebook
            </Button>
            <Button
              size="sm"
              onClick={() => handleShare('whatsapp')}
              className="flex-1 min-w-[100px] justify-center bg-[#25D366] hover:bg-[#1da851] text-white border-none"
            >
              WhatsApp
            </Button>
            <Button
              size="sm"
              onClick={() => handleShare('twitter')}
              className="flex-1 min-w-[100px] justify-center bg-black hover:bg-neutral-800 text-white border-none dark:bg-white dark:hover:bg-neutral-200 dark:text-black"
            >
              X / Twitter
            </Button>
            <Button
              size="sm"
              onClick={() => handleShare('email')}
              className="flex-1 min-w-[100px] justify-center bg-primary hover:bg-primary/90 text-primary-foreground border-none"
            >
              Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Referral Stats</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">{stats.totalReferrals}</p>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-yellow-500">{stats.pendingReferrals}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-500">{stats.rewardedReferrals}</p>
              <p className="text-xs text-muted-foreground">Rewarded</p>
            </div>
          </div>

          {stats.totalReferrals === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Share your code to start earning rewards!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
