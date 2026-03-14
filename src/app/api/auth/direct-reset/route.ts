import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        // 1. Find the user ID by email in the profiles table using supabaseAdmin (bypassing RLS)
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single()

        if (profileError || !profile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // 2. Update the user's password using Supabase Admin client
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
            profile.id,
            { password: password }
        )

        if (authUpdateError) {
            console.error('Error updating auth password:', authUpdateError)
            return NextResponse.json({ error: `Gagal memperbarui password: ${authUpdateError.message}` }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'Password berhasil diperbarui'
        })

    } catch (error) {
        console.error('Unexpected error in direct reset route:', error)
        return NextResponse.json(
            { error: 'Internal server error while processing request' },
            { status: 500 }
        )
    }
}
