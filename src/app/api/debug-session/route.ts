import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 1. Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // 2. Check user (validates with Supabase server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // 3. If we have a user, try to fetch their profile
    let profileResult = null;
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      profileResult = { data, error };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session: session ? { 
        user_id: session.user.id, 
        email: session.user.email,
        expires_at: session.expires_at,
      } : null,
      sessionError: sessionError?.message || null,
      user: user ? { 
        id: user.id, 
        email: user.email, 
        name: user.user_metadata?.full_name 
      } : null,
      userError: userError?.message || null,
      profile: profileResult?.data || null,
      profileError: profileResult?.error ? {
        code: profileResult.error.code,
        message: profileResult.error.message,
        details: profileResult.error.details,
        hint: profileResult.error.hint,
      } : null,
    });
  } catch (e: any) {
    return NextResponse.json({ crash: e.message }, { status: 500 });
  }
}
