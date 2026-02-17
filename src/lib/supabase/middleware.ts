import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Define protected routes
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register')
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
    const isStudentRoute = request.nextUrl.pathname.startsWith('/student')
    const isProtectedRoute = isAdminRoute || isStudentRoute

    // If user is not logged in and trying to access protected routes
    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If user is logged in and trying to access auth routes
    if (user && isAuthRoute) {
        // Get user role from user metadata
        const role = user.user_metadata?.role || 'student'
        const url = request.nextUrl.clone()
        url.pathname = role === 'admin' ? '/admin/dashboard' : '/student/dashboard'
        return NextResponse.redirect(url)
    }

    // If user is logged in, check role-based access
    if (user) {
        const role = user.user_metadata?.role || 'student'
        const status = user.user_metadata?.status || 'active' // Default to active for old users
        const isWaitingApprovalRoute = request.nextUrl.pathname === '/waiting-approval'

        // Check approval status for students
        if (role === 'student' && status === 'pending') {
            if (!isWaitingApprovalRoute) {
                const url = request.nextUrl.clone()
                url.pathname = '/waiting-approval'
                return NextResponse.redirect(url)
            }
            return supabaseResponse
        }

        // If active student tries to access waiting page, redirect to dashboard
        if (role === 'student' && status === 'active' && isWaitingApprovalRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/student/dashboard'
            return NextResponse.redirect(url)
        }


        // Student trying to access admin routes
        if (isAdminRoute && role !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/student/dashboard'
            return NextResponse.redirect(url)
        }

        // Admin trying to access student routes (allow this for testing purposes)
        // Uncomment below if you want to restrict admins from student routes
        // if (isStudentRoute && role === 'admin') {
        //   const url = request.nextUrl.clone()
        //   url.pathname = '/admin/dashboard'
        //   return NextResponse.redirect(url)
        // }
    }

    return supabaseResponse
}
