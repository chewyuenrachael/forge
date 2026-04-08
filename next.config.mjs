/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
    outputFileTracingIncludes: {
      '/**/*': ['./forge.db'],
    },
  },
}

export default nextConfig