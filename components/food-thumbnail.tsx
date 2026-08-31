import Image from "next/image";
import { resolveFoodImage } from "@/lib/food-images";

type FoodThumbnailProps = {
  imageKey?: string | null;
  name: string;
  className?: string;
  sizes?: string;
  decorative?: boolean;
};

export function FoodThumbnail({
  imageKey,
  name,
  className = "size-12",
  sizes = "48px",
  decorative = false,
}: FoodThumbnailProps) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-2xl bg-slate-100 ${className}`}>
      <Image
        src={resolveFoodImage(imageKey)}
        alt={decorative ? "" : `Minh họa ${name}`}
        fill
        sizes={sizes}
        placeholder="blur"
        className="object-cover"
      />
    </span>
  );
}
