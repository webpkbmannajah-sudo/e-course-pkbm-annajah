import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isAdminRole } from '@/lib/roles'

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

        if (!isAdminRole(profile?.role)) {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 })
        }

        // 2. Parse request body
        const body = await request.json()
        const { userId, name, email, phone, education_level, address, enrollment_year } = body

        if (!userId || !email || !name) {
            return NextResponse.json({ error: 'Missing required fields: userId, name, and email' }, { status: 400 })
        }

        // 3. Update the user's email in Auth (requires admin privileges)
        // We only update if it's different from current, but Supabase admin API handles identical updates gracefully
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { email: email }
        )

        if (authUpdateError) {
            console.error('Error updating auth email:', authUpdateError)
            return NextResponse.json({ error: `Gagal memperbarui email auth: ${authUpdateError.message}` }, { status: 500 })
        }

        // 4. Update the user's profile in the database
        const { error: profileUpdateError } = await supabaseSession
            .from('profiles')
            .update({
                name,
                email, // Sync email to profile as well
                phone: phone || null,
                education_level: education_level || null,
                address: address || null,
                enrollment_year: enrollment_year || null
            })
            .eq('id', userId)

        if (profileUpdateError) {
            console.error('Error updating user profile:', profileUpdateError)
            return NextResponse.json({ error: `Gagal memperbarui profil: ${profileUpdateError.message}` }, { status: 500 })
        }

        // 5. Return success
        return NextResponse.json({
            success: true,
            message: 'Data siswa berhasil diperbarui'
        })

    } catch (error) {
        console.error('Unexpected error in update user route:', error)
        return NextResponse.json(
            { error: 'Internal server error while processing request' },
            { status: 500 }
        )
    }
}
