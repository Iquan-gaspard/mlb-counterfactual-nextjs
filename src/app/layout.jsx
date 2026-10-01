import "./globals.css";
import PitcherProvider from "./PitcherProvider";

export const metadata = {
  title: "AI 棒球賽局推演系統",
  description: "MLB Counterfactual Analysis and Sequence Builder",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body suppressHydrationWarning>
        <PitcherProvider>{children}</PitcherProvider>
      </body>
    </html>
  );
}
