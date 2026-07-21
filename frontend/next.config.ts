import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Next 16 build dùng Turbopack; webpack config bên dưới chỉ áp dụng khi dev bằng webpack
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = "source-map";
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
