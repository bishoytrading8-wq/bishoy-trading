import { getCategories, getCategoryCounts, countProducts } from "./lib/catalog";
import HomeClient from "./components/HomeClient";

export const revalidate = 0;

// ⚡ السيرفر بيجهز كل البيانات قبل ما الصفحة توصل للتليفون = فتح لحظي
export default async function Home() {
  const [cats, counts, total] = await Promise.all([
    getCategories(),
    getCategoryCounts(),
    countProducts(),
  ]);

  return <HomeClient cats={cats} counts={counts} total={total} />;
}