import { createClient } from '@/lib/supabase/server';
import SynonymsManager from '@/components/admin/SynonymsManager';
import StopwordsManager from '@/components/admin/StopwordsManager';
import RankingTuner from '@/components/admin/RankingTuner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function AdminSearchPage() {
  const supabase = await createClient();
  let show = false;
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = (userData as any)?.user;
    if (user?.id) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (profile && (profile as any).role === 'admin') show = true;
    }
  } catch (e) {
    // ignore
  }

  if (!show) return (
    <div className="container mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Unauthorized</CardTitle>
          <CardDescription>You must be an admin to manage search synonyms and stopwords.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Log in as an admin and try again.</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Search Management</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Synonyms</CardTitle>
              <CardDescription>Manage search synonyms</CardDescription>
            </CardHeader>
            <CardContent>
              <SynonymsManager />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Stopwords</CardTitle>
              <CardDescription>Manage stopwords</CardDescription>
            </CardHeader>
            <CardContent>
              <StopwordsManager />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Ranking Tuner</CardTitle>
            <CardDescription>Tweak weights and preview search result ordering</CardDescription>
          </CardHeader>
          <CardContent>
            <RankingTuner />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
