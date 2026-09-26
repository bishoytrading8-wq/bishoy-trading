import { NextResponse } from "next/server";
import { getCategories, getCategoryCounts } from "../../lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const [cats, counts] = await Promise.all([getCategories(), getCategoryCounts()]);
  return NextResponse.json({ cats, counts });
}