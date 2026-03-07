import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isAdminRole, isSuperAdmin } from '@/lib/roles'

export async function POST(request: Request) {
    try {
        // 1. Verify the requesting user is an admin
        const supabaseSession = await createClient()
        const { data: { user }, error: authError } = await supabaseSession.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Call profiles table to check if they have the 'admin' role
        const { data: profile } = await supabaseSession
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!isAdminRole(profile?.role, user.email)) {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 })
        }

        // 2. Parse request body
        const body = await request.json()
        const { userId, newPassword } = body

        if (!userId || !newPassword) {
            return NextResponse.json({ error: 'Missing required fields: userId and newPassword' }, { status: 400 })
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
        }

        // Fetch target user's profile to prevent modifying a superadmin if caller is not one
        const { data: targetProfile } = await supabaseSession
            .from('profiles')
            .select('role, email')
            .eq('id', userId)
            .single()

        if (targetProfile && isSuperAdmin(targetProfile.role, targetProfile.email)) {
            if (!isSuperAdmin(profile?.role, user.email)) {
                return NextResponse.json({ error: 'Forbidden. Super Admin access required to modify a Super Admin account.' }, { status: 403 })
            }
        }

        // 3. Update the user's password using the admin client
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        )

        if (updateError) {
            console.error('Error updating user password:', updateError)

            // Handle specific Supabase Auth error for users created manually via SQL
            if (updateError.message.includes('Database error loading user')) {
                return NextResponse.json({
                    error: 'Gagal mereset password. Akun ini kemungkinan dibuat secara manual via SQL sehingga data otentikasinya di Supabase tidak lengkap. Silakan hapus dan buat ulang akun ini.'
                }, { status: 500 })
            }

            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        // 4. Return success
        return NextResponse.json({
            success: true,
            message: 'Password updated successfully'
        })

    } catch (error) {
        console.error('Unexpected error in password reset route:', error)
        return NextResponse.json(
            { error: 'Internal server error while processing request' },
            { status: 500 }
        )
    }
}
