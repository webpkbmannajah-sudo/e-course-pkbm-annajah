import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ip_address, user_agent, status, failure_reason } = await request.json();

    const { error } = await supabase.from('login_history').insert({
        user_id: user.id,
        ip_address,
        user_agent,
        status,
        failure_reason,
    });

    if (error) {
        console.error('Error logging login:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Also update last_login_at
    await supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);

    return NextResponse.json({ message: 'Login logged' });
}
