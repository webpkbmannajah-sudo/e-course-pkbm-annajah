/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static generation for pages that require runtime environment variables
  experimental: {
    // This is needed for Supabase auth to work properly
  },
  // Skip type checking during build (we'll run it separately)
  typescript: {
    ignoreBuildErrors: false,
  },

}

export default nextConfig
