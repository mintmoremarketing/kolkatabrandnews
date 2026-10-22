import { withPayload } from '@payloadcms/next/withPayload'

export default withPayload({
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  experimental: { serverActions: { bodySizeLimit: '20mb' } },
  images: { unoptimized: true },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ] }]
  },
})
