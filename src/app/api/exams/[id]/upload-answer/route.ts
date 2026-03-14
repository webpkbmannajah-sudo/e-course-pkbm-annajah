import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const oldFileUrl = formData.get('oldFileUrl') as string | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file type (server-side enforcement)
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipe file tidak didukung. Hanya PDF dan gambar (JPEG, PNG, WebP) yang diizinkan.' }, { status: 400 })
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 })
        }

        // Verify exam exists and is of type pdf
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('type')
            .eq('id', id)
            .single()

        if (examError || !exam || exam.type !== 'pdf') {
            return NextResponse.json({ error: 'Invalid exam' }, { status: 400 })
        }

        // Delete old file if provided
        if (oldFileUrl) {
            try {
                const urlParts = oldFileUrl.split('/public/exams/')
                if (urlParts.length === 2) {
                    const filePath = urlParts[1]
                    const { error: removeError } = await supabaseAdmin.storage.from('exams').remove([filePath])
                    if (removeError) {
                        console.error('Failed to remove old file:', removeError)
                    }
                }
            } catch (e) {
                console.error('Error parsing old file url:', e)
            }
        }

        // Upload to exams bucket
        const fileExt = file.name.split('.').pop()
        const fileName = `answers/${id}/${user.id}-${Date.now()}.${fileExt}`

        // We use supabaseAdmin to bypass RLS for insertion
        const { error: uploadError } = await supabaseAdmin.storage
            .from('exams')
            .upload(fileName, file)

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload file: ' + uploadError.message }, { status: 500 })
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('exams')
            .getPublicUrl(fileName)

        return NextResponse.json({ url: publicUrl })

    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
