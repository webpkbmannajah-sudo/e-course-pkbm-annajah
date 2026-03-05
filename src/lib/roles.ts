export const SUPER_ADMIN_EMAIL = 'webpkbmannajah@gmail.com'

export function isAdminRole(role?: string | null): boolean {
    return role === 'admin' || role === 'superadmin'
}

export function isSuperAdmin(role?: string | null): boolean {
    return role === 'superadmin'
}
