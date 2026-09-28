import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { getProduct } from "@/lib/api";

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;

  try {
    const product = await getProduct(slug);
    return <ProductDetail product={product} />;
  } catch {
    notFound();
  }
}
