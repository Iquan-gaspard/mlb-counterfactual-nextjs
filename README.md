v1.0 (Vanilla JS + Python Monolith)： 專注於完成領域邏輯（Domain Logic），成功將 PyTorch 訓練的 Transformer 模型落地，驗證 20 維棒球物理特徵與九宮格座標映射的可行性。

v2.0 (Vite React SPA + REST API)： 隨著「自由配球」與「實戰紀錄」的雙頁面需求增加，原生 JS 狀態變得難以維護。將前後端分離，導入 React Component 提升程式碼復用率，並解決跨網域（CORS）請求問題。

v3.0 (Next.js App Router BFF)： 為了解決 SPA 首次載入效能（FCP）並保護後端 AI API 端點，升級為 Next.js 架構。利用 Server Components 與 Vercel 部署，完成具備高安全性與擴展性的企業級系統。

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
