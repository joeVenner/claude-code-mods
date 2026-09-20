import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The marketplace is a static catalog site: no server runtime, deployable to Cloudflare Pages.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
