/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/app/dashboard',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/app',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/app/:path*',
        destination: '/:path*',
        permanent: true,
      },
      {
        source: '/auth/sign-in',
        destination: '/sign-in',
        permanent: true,
      },
      {
        source: '/auth/sign-up',
        destination: '/sign-up',
        permanent: true,
      },
      {
        source: '/auth/forgot-password',
        destination: '/forgot-password',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
