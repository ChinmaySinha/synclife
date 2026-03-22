import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Validate JWT against Supabase auth server (not just reading cookies)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ user: null, profile: null, partner: null });
    }

    // Fetch profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Auto-create profile if missing (OAuth users)
    if (profileError && profileError.code === 'PGRST116') {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

      const { data: newProfile } = await supabase.from('profiles').insert({
        id: user.id,
        name,
        timezone: 'UTC',
        invite_code: inviteCode,
        points: 0,
        show_onboarding: true,
      }).select().single();

      if (newProfile) {
        profile = newProfile;
      }
    }

    // Fetch partner if linked
    let partner = null;
    if (profile?.partner_id) {
      const { data: partnerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.partner_id)
        .single();
      partner = partnerData;
    }

    return NextResponse.json({ user, profile, partner });
  } catch (e: any) {
    return NextResponse.json(
      { user: null, profile: null, partner: null, error: e.message },
      { status: 500 }
    );
  }
}
