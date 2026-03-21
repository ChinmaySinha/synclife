import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if user has a profile, create one if not (For OAuth users)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
          
          await supabase.from('profiles').insert({
            id: user.id,
            name: name,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            invite_code: inviteCode,
            points: 0,
            show_onboarding: true,
          });
        }
      }
    }
  }

  return NextResponse.redirect(new URL('/today', request.url));
}
