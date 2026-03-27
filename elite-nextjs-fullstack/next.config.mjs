/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  serverExternalPackages: ["@react-pdf/renderer", "mongoose", "resend"]
};

export default nextConfig;
