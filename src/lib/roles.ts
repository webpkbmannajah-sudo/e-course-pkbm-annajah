export const SUPER_ADMIN_EMAIL = 'webpkbmannajah@gmail.com'

export function isSuperAdmin(role?: string | null, email?: string | null): boolean {
    if (email && email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
        return true
    }
    return role === 'superadmin'
}

export function isAdminRole(role?: string | null, email?: string | null): boolean {
    if (isSuperAdmin(role, email)) return true
    return role === 'admin' || role === 'superadmin'
}
