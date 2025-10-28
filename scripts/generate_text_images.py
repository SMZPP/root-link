from PIL import Image, ImageDraw, ImageFont
import os
import sys
import datetime
import json

# 各種テキスト
texts = {
    "lgtm": "L　G　T　M",
    "goodjob": "GOOD JOB！",
    "otsukare": "お疲れさま！",
    "approved": "APPROVED"
}

# 出力フォルダ作成
for folder in texts.keys():
    os.makedirs(f"images/{folder}", exist_ok=True)

work_dir = "images/work"

# フォント設定（日本語対応）
try:
    font = ImageFont.truetype("meiryo.ttc", 80)  # Windows
except OSError:
    font_path = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"  # Linux
    if not os.path.exists(font_path):
        print("日本語フォントが見つかりません。Linuxなら fonts-noto-cjk をインストールしてください。")
        sys.exit(1)
    font = ImageFont.truetype(font_path, 80)

# 画像処理
for filename in os.listdir(work_dir):
    if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
        continue

    img_path = os.path.join(work_dir, filename)
    img = Image.open(img_path).convert("RGBA")

    for folder, text in texts.items():
        new_img = img.copy()
        draw = ImageDraw.Draw(new_img)

        # 中央位置計算
        W, H = new_img.size
        bbox = draw.textbbox((0, 0), text, font=font)
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        position = ((W - w) / 2, (H - h) / 2)

        # 半透明黒オーバーレイ
        overlay = Image.new("RGBA", new_img.size, (0, 0, 0, 100))
        new_img = Image.alpha_composite(new_img, overlay)
        draw = ImageDraw.Draw(new_img)

        # 白文字＋影
        draw.text((position[0]+2, position[1]+2), text, font=font, fill=(0,0,0,150))
        draw.text(position, text, font=font, fill=(255,255,255,255))

        # 保存
        output_path = f"images/{folder}/{filename}"
        new_img.convert("RGB").save(output_path, "JPEG")
        print(f"✅ Generated {folder}/{filename}")

# JSON 自動生成（★ 最新の画像を最初にソートして出力）
for folder in texts.keys():
    folder_path = f"images/{folder}"
    images = [
        f for f in os.listdir(folder_path)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ]

    # ★ ファイル名の日付部分（例: 2025-10-28_～）で降順ソート
    images.sort(reverse=True)

    json_path = os.path.join(folder_path, "index.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(images, f, ensure_ascii=False, indent=2)
    print(f"📝 Generated {json_path}")

# work フォルダの中身を削除（フォルダは残す）
for f in os.listdir(work_dir):
    f_path = os.path.join(work_dir, f)
    if os.path.isfile(f_path):
        os.remove(f_path)

print("🧹 Cleaned up images/work/")
