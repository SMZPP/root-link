import os
import requests
import datetime
import shutil

API_KEY = os.getenv("PEXELS_API_KEY")
headers = {"Authorization": API_KEY}

topics = ["nature", "city", "ocean", "sky", "animal", "space"]

today = datetime.date.today().strftime("%Y-%m-%d")

work_dir = "images/work"
os.makedirs(work_dir, exist_ok=True)

# ① 古いworkフォルダを空にする
for f in os.listdir(work_dir):
    path = os.path.join(work_dir, f)
    if os.path.isfile(path):
        os.remove(path)

# ② 各テーマの画像を1枚ずつ取得
for topic in topics:
    url = f"https://api.pexels.com/v1/search?query={topic}&per_page=5"
    res = requests.get(url, headers=headers)
    data = res.json()

    if not data.get("photos"):
        print(f"⚠️ {topic}: No photo found")
        continue

    photo = data["photos"][0]
    img_url = photo["src"]["landscape"]
    save_path = os.path.join(work_dir, f"{today}_{topic}.jpg")

    img_data = requests.get(img_url).content
    with open(save_path, "wb") as f:
        f.write(img_data)

    print(f"✅ {topic} image saved to {save_path}")

print("🎉 All 6 images downloaded to work/")
