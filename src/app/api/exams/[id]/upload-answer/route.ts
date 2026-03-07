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

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
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
