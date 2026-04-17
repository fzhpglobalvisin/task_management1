import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // "next" allows you to redirect to a specific page after login, defaults to home
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    
    // This exchanges the temporary code for a permanent session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Login successful! Send user to the home page
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's an error, send them to a login page with an error message
  return NextResponse.redirect(`${origin}/login?message=Could not authenticate user`);
}