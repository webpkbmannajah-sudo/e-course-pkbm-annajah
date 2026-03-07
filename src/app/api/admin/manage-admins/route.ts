import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isSuperAdmin } from '@/lib/roles'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only superadmin can manage admins
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!isSuperAdmin(profile?.role, user.email)) {
            return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 })
        }

        // Fetch all admin and superadmin users
        const { data: admins, error } = await supabase
            .from('profiles')
            .select('id, name, email, role, created_at')
            .in('role', ['admin', 'superadmin'])
            .order('created_at', { ascending: true })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const adminsWithRoles = (admins || []).map(admin => {
            if (isSuperAdmin(admin.role, admin.email)) {
                return { ...admin, role: 'superadmin' }
            }
            return admin
        })

        return NextResponse.json({ admins: adminsWithRoles })
    } catch (error) {
        console.error('Error fetching admins:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only superadmin can create admins
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!isSuperAdmin(profile?.role, user.email)) {
            return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 })
        }

        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
        }

        // Create admin user via Supabase Admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name: email.split('@')[0],
                role: 'admin',
            }
        })

        if (createError) {
            console.error('Error creating admin:', createError)
            return NextResponse.json({ error: `Gagal membuat admin: ${createError.message}` }, { status: 500 })
        }

        // The profile should be created automatically by Supabase trigger,
        // but let's ensure it exists with the correct role
        if (newUser?.user) {
            await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: newUser.user.id,
                    email,
                    name: email.split('@')[0],
                    role: 'admin',
                    is_active: true,
                    status: 'active',
                }, { onConflict: 'id' })
        }

        return NextResponse.json({
            success: true,
            message: 'Admin berhasil ditambahkan',
            admin: { id: newUser?.user?.id, email }
        })
    } catch (error) {
        console.error('Error creating admin:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only superadmin can delete admins
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!isSuperAdmin(profile?.role, user.email)) {
            return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 })
        }

        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json({ error: 'User ID wajib diisi' }, { status: 400 })
        }

        // Prevent deleting yourself (superadmin)
        if (userId === user.id) {
            return NextResponse.json({ error: 'Tidak dapat menghapus akun Super Admin sendiri' }, { status: 400 })
        }

        // Delete from auth
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (deleteError) {
            console.error('Error deleting admin auth:', deleteError)

            // Handle specific Supabase Auth error for users created manually via SQL
            if (deleteError.message.includes('Database error loading user')) {
                return NextResponse.json({
                    error: 'Gagal menghapus lewat sistem. Akun ini kemungkinan dibuat secara manual via SQL sehingga tidak terdaftar dengan benar di Supabase Auth. Silakan hapus langsung dari menu Authentication di Supabase Dashboard.'
                }, { status: 500 })
            }

            return NextResponse.json({ error: `Gagal menghapus admin: ${deleteError.message}` }, { status: 500 })
        }

        // Delete from profiles
        await supabase
            .from('profiles')
            .delete()
            .eq('id', userId)

        return NextResponse.json({ success: true, message: 'Admin berhasil dihapus' })
    } catch (error) {
        console.error('Error deleting admin:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
