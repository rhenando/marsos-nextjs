// app/page.js
"use client";

import dynamic from "next/dynamic";

// client-only imports
const HeroSection = dynamic(() => import("@/components/home/HeroSection"), {
  ssr: false,
});
const TrendingProductsSection = dynamic(
  () => import("@/components/home/TrendingProductsSection"),
  { ssr: false }
);

import CategoryGrid from "@/components/home/CategoryGrid";

export default function Home() {
  return (
    <main className='flex flex-col'>
      <HeroSection />
      <TrendingProductsSection />
      <CategoryGrid />
    </main>
  );
}
