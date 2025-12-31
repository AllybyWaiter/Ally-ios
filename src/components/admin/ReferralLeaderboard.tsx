import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Gift, Users, Trophy, DollarSign, Medal, Download } from 'lucide-react';
import { useReferralLeaderboard, useReferralProgramStats, type LeaderboardEntry } from '@/hooks/useReferralLeaderboard';
import { cn } from '@/lib/utils';

type TimePeriod = 'all' | '30d' | '7d';

function StatCard({ title, value, subtitle, icon: Icon }: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <Medal className="h-5 w-5 text-yellow-500" />;
  }
  if (rank === 2) {
    return <Medal className="h-5 w-5 text-gray-400" />;
  }
  if (rank === 3) {
    return <Medal className="h-5 w-5 text-amber-600" />;
  }
  return <span className="text-muted-foreground font-medium">{rank}</span>;
}

function LeaderboardRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  return (
    <TableRow className={cn(rank <= 3 && 'bg-muted/30')}>
      <TableCell className="w-12 text-center">
        <RankBadge rank={rank} />
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{entry.name || 'No name'}</span>
          <span className="text-xs text-muted-foreground">{entry.email}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-mono">{entry.code}</Badge>
      </TableCell>
      <TableCell className="text-center font-semibold">{entry.totalReferrals}</TableCell>
      <TableCell className="text-center">
        <span className="text-yellow-600">{entry.pendingReferrals}</span>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-green-600">{entry.qualifiedReferrals}</span>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-primary">{entry.rewardedReferrals}</span>
      </TableCell>
      <TableCell className="text-right font-medium">
        ${entry.totalRewardsValue.toFixed(2)}
      </TableCell>
    </TableRow>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-3">
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function ReferralLeaderboard() {
  const [period, setPeriod] = useState<TimePeriod>('all');
  const { data: leaderboard, isLoading: leaderboardLoading } = useReferralLeaderboard(period);
  const { data: stats, isLoading: statsLoading } = useReferralProgramStats();

  const isLoading = leaderboardLoading || statsLoading;

  const exportToCSV = () => {
    if (!leaderboard?.length) return;

    const headers = ['Rank', 'Name', 'Email', 'Code', 'Total', 'Pending', 'Qualified', 'Rewarded', 'Rewards Value'];
    const rows = leaderboard.map((entry, index) => [
      index + 1,
      entry.name || '',
      entry.email,
      entry.code,
      entry.totalReferrals,
      entry.pendingReferrals,
      entry.qualifiedReferrals,
      entry.rewardedReferrals,
      entry.totalRewardsValue.toFixed(2),
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referral-leaderboard-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Referral Codes"
          value={stats?.totalCodes.toLocaleString() || 0}
          subtitle="Users with codes"
          icon={Gift}
        />
        <StatCard
          title="Total Referrals"
          value={stats?.totalReferrals.toLocaleString() || 0}
          subtitle="All time signups"
          icon={Users}
        />
        <StatCard
          title="Qualified Referrals"
          value={stats?.qualifiedReferrals.toLocaleString() || 0}
          subtitle="Converted to paid"
          icon={Trophy}
        />
        <StatCard
          title="Rewards Distributed"
          value={stats?.rewardsDistributed || 0}
          subtitle={`Est. value: $${stats?.estimatedValue.toFixed(2) || '0.00'}`}
          icon={DollarSign}
        />
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Referrers
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Users ranked by total referrals
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!leaderboard?.length}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!leaderboard?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No referrals yet</p>
              <p className="text-sm">When users start referring friends, they'll appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead className="text-center">Qualified</TableHead>
                    <TableHead className="text-center">Rewarded</TableHead>
                    <TableHead className="text-right">Rewards Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry, index) => (
                    <LeaderboardRow key={entry.userId} entry={entry} rank={index + 1} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
