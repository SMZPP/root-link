from PIL import Image, ImageDraw, ImageFont
import os
import datetime
import shutil
import sys

texts = {
    "lgtm": "LGTM",
    "goodjob": "GOOD JOB!",
    "otsukare": "今日も一日お疲れさま！",
    "approved": "Approved"
}

# 各フォルダ作成
for folder in texts.keys():
    os.makedirs(f"images/{folder}", exist_ok=True)

work_dir = "images/work"
today = datetime.date.today().strftime("%Y-%m-%d")

# フォントを OS に応じて切り替え
try:
    # Windows用
    font = ImageFont.truetype("arial.ttf", 80)
except OSError:
    # Linux用 (GitHub Actions)
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    if not os.path.exists(font_path):
        print("フォントが見つかりません。Linuxなら fonts-dejavu-core をインストールしてください。")
        sys.exit(1)
    font = ImageFont.truetype(font_path, 80)

# work フォルダの画像を処理
for filename in os.listdir(work_dir):
    if not filename.lower().endswith(".jpg"):
        continue

    img_path = os.path.join(work_dir, filename)
    img = Image.open(img_path).convert("RGBA")

    for folder, text in texts.items():
        new_img = img.copy()
        draw = ImageDraw.Draw(new_img)

        # 文字位置を中央に
        W, H = new_img.size
        bbox = draw.textbbox((0, 0), text, font=font)
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        position = ((W - w) / 2, (H - h) / 2)

        # 半透明黒背景（文字視認性UP）
        overlay = Image.new("RGBA", new_img.size, (0, 0, 0, 100))
        new_img = Image.alpha_composite(new_img, overlay)
        draw = ImageDraw.Draw(new_img)

        # 白文字＋軽い影
        draw.text((position[0]+2, position[1]+2), text, font=font, fill=(0,0,0,150))
        draw.text(position, text, font=font, fill=(255,255,255,255))

        output_path = f"images/{folder}/{filename}"
        new_img.convert("RGB").save(output_path, "JPEG")
        print(f"✅ Generated {folder}/{filename}")

# 最後に work フォルダを空にする
for f in os.listdir(work_dir):
    os.remove(os.path.join(work_dir, f))

print("🧹 Cleaned up images/work/")
