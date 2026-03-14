import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email } = body

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Use supabaseAdmin to bypass RLS since the user is not authenticated yet
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('id, email')
            .eq('email', email)
            .single()

        if (error || !profile) {
            return NextResponse.json({ exists: false }, { status: 404 })
        }

        return NextResponse.json({ exists: true }, { status: 200 })

    } catch (error) {
        console.error('Error checking email:', error)
        return NextResponse.json(
            { error: 'Internal server error while processing request' },
            { status: 500 }
        )
    }
}
