from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "foods"
OUTPUT.mkdir(parents=True, exist_ok=True)

FOODS = {
    "pho-bo-v1": ("🍜", "noodles"), "pho-ga-v1": ("🍜", "noodles"),
    "bun-bo-hue-v1": ("🍜", "noodles"), "bun-cha-v1": ("🍜", "noodles"),
    "hu-tieu-v1": ("🍜", "noodles"), "mi-quang-v1": ("🍜", "noodles"),
    "com-tam-suon-v1": ("🍛", "rice"), "com-ga-nuong-v1": ("🍛", "rice"),
    "com-chien-duong-chau-v1": ("🍚", "rice"), "banh-mi-thit-v1": ("🥖", "bread"),
    "banh-mi-trung-v1": ("🥪", "bread"), "banh-cuon-v1": ("🥟", "bread"),
    "goi-cuon-v1": ("🥟", "bread"), "chao-ga-v1": ("🥣", "soup"),
    "ca-kho-to-v1": ("🐟", "protein"), "canh-chua-ca-v1": ("🥣", "soup"),
    "uc-ga-ap-chao-v1": ("🍗", "protein"), "dui-ga-bo-da-v1": ("🍗", "protein"),
    "thit-bo-nac-v1": ("🥩", "protein"), "thit-heo-nac-v1": ("🥩", "protein"),
    "ca-hoi-v1": ("🐟", "protein"), "ca-ngu-v1": ("🐟", "protein"),
    "ca-ro-phi-v1": ("🐟", "protein"), "tom-v1": ("🍤", "protein"),
    "trung-ga-luoc-v1": ("🥚", "protein"), "dau-hu-v1": ("◻️", "protein"),
    "com-trang-v1": ("🍚", "staples"), "com-gao-lut-v1": ("🍚", "staples"),
    "khoai-lang-v1": ("🍠", "staples"), "khoai-tay-v1": ("🥔", "staples"),
    "yen-mach-v1": ("🥣", "staples"), "bun-tuoi-v1": ("🍜", "staples"),
    "bong-cai-xanh-v1": ("🥦", "vegetables"), "rau-muong-v1": ("🥬", "vegetables"),
    "rau-chan-vit-v1": ("🥬", "vegetables"), "ca-rot-v1": ("🥕", "vegetables"),
    "ca-chua-v1": ("🍅", "vegetables"), "dua-leo-v1": ("🥒", "vegetables"),
    "nam-mo-v1": ("🍄", "vegetables"), "chuoi-v1": ("🍌", "fruit"),
    "tao-v1": ("🍎", "fruit"), "cam-v1": ("🍊", "fruit"),
    "thanh-long-v1": ("🌺", "fruit"), "bo-v1": ("🥑", "fruit"),
    "xoai-v1": ("🥭", "fruit"), "sua-tuoi-khong-duong-v1": ("🥛", "dairy"),
    "sua-chua-khong-duong-v1": ("🥣", "dairy"), "sua-dau-nanh-khong-duong-v1": ("🥛", "dairy"),
    "nuoc-mam-v1": ("🫙", "seasonings"), "nuoc-tuong-v1": ("🫙", "seasonings"),
    "dau-hao-v1": ("🫙", "seasonings"), "duong-trang-v1": ("🥄", "seasonings"),
    "dau-o-liu-v1": ("🫒", "seasonings"), "muoi-v1": ("🧂", "seasonings"),
}

PALETTES = {
    "noodles": ((255, 245, 226), (255, 205, 124), (196, 84, 34)),
    "rice": ((255, 250, 226), (244, 215, 128), (133, 92, 46)),
    "bread": ((255, 246, 224), (231, 184, 106), (139, 83, 42)),
    "soup": ((236, 251, 244), (146, 220, 182), (27, 120, 86)),
    "protein": ((255, 238, 232), (242, 164, 142), (157, 57, 57)),
    "staples": ((250, 244, 233), (218, 191, 148), (122, 91, 54)),
    "vegetables": ((232, 250, 238), (126, 211, 148), (27, 126, 74)),
    "fruit": ((255, 240, 230), (255, 174, 112), (200, 75, 56)),
    "dairy": ((235, 247, 255), (154, 211, 241), (45, 111, 163)),
    "seasonings": ((246, 239, 255), (191, 164, 229), (102, 70, 145)),
}

FONT_PATHS = [
    Path("C:/Windows/Fonts/seguiemj.ttf"),
    Path("C:/Windows/Fonts/segoeui.ttf"),
]
FONT_PATH = next(path for path in FONT_PATHS if path.exists())
FONT = ImageFont.truetype(str(FONT_PATH), 210)


def mix(a, b, amount):
    return tuple(round(a[i] * (1 - amount) + b[i] * amount) for i in range(3))


def make_image(key, emoji, category):
    width, height = 800, 600
    light, mid, dark = PALETTES[category]
    image = Image.new("RGB", (width, height), light)
    pixels = image.load()
    for y in range(height):
        for x in range(width):
            vertical = y / height
            radial = min(1, ((x - 650) ** 2 + (y - 80) ** 2) ** 0.5 / 700)
            pixels[x, y] = mix(mix(light, mid, vertical * 0.72), dark, (1 - radial) * 0.08)

    glow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((500, -140, 900, 260), fill=(*mix(light, (255, 255, 255), 0.7), 130))
    glow = glow.filter(ImageFilter.GaussianBlur(55))
    image = Image.alpha_composite(image.convert("RGBA"), glow)

    draw = ImageDraw.Draw(image)
    draw.ellipse((160, 420, 640, 535), fill=(49, 39, 31, 35))
    draw.ellipse((145, 175, 655, 505), fill=(255, 255, 255, 238), outline=(*mix(mid, dark, 0.35), 210), width=7)
    draw.ellipse((196, 220, 604, 466), fill=(*mix(light, mid, 0.33), 255))

    for dx, dy, radius in [(110, 112, 18), (680, 390, 14), (650, 118, 10), (98, 450, 9)]:
        draw.ellipse((dx - radius, dy - radius, dx + radius, dy + radius), fill=(*dark, 45))

    bbox = draw.textbbox((0, 0), emoji, font=FONT, embedded_color=True)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((width - text_width) / 2, 318 - text_height / 2 - bbox[1])
    draw.text(position, emoji, font=FONT, embedded_color=True)

    image.convert("RGB").save(OUTPUT / f"{key}.webp", "WEBP", quality=84, method=6)


for image_key, (icon, group) in FOODS.items():
    make_image(image_key, icon, group)

make_image("fallback-food-v1", "🍽️", "staples")

registry_path = OUTPUT.parents[1] / "lib" / "food-images.ts"
keys = [*FOODS.keys(), "fallback-food-v1"]
imports = []
entries = []
for index, image_key in enumerate(keys):
    variable = f"foodImage{index}"
    imports.append(f'import {variable} from "@/assets/foods/{image_key}.webp";')
    entries.append(f'  "{image_key}": {variable},')

registry_path.write_text(
    'import type { StaticImageData } from "next/image";\n'
    + "\n".join(imports)
    + "\n\n"
    + "export const foodImages: Record<string, StaticImageData> = {\n"
    + "\n".join(entries)
    + "\n};\n\n"
    + 'export const fallbackFoodImage = foodImages["fallback-food-v1"];\n\n'
    + "export function resolveFoodImage(imageKey: string | null | undefined) {\n"
    + "  return (imageKey && foodImages[imageKey]) || fallbackFoodImage;\n"
    + "}\n",
    encoding="utf-8",
)

print(f"Generated {len(FOODS) + 1} food images in {OUTPUT}")
print(f"Generated image registry at {registry_path}")
