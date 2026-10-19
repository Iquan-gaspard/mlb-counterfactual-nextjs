/** @type {import('next').NextConfig} */
const nextConfig = {
  /* 效能最佳化 */
  reactCompiler: true,

  /* 🛡️ 1. 防洩漏：強制關閉生產環境 Source Maps (你原本設定的，保留) */
  productionBrowserSourceMaps: false,

  /* 🛡️ 2. 防刺探：隱藏 X-Powered-By: Next.js 伺服器指紋 (零副作用) */
  poweredByHeader: false,

  /* 🛡️ 3. 基礎溫和安全標頭 (絕不阻擋正常功能) */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN", // 避免被惡意網站用 iframe 嵌入釣魚
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // 防止 MIME 類型混淆攻擊
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin", // 保護請求來源隱私
          },
        ],
      },
    ];
  },
};

export default nextConfig;
