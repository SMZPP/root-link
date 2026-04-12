#!/usr/bin/env python3
"""
AI News Fetcher
毎日 GitHub Actions で実行し、AI 関連の日本語ニュースを RSS から収集して JSON に保存する。
"""

import feedparser
import json
import hashlib
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

JST = timezone(timedelta(hours=9))

# ============================================================
# RSS ソース一覧（日本語）
# ============================================================
RSS_SOURCES = [
    # --- Zenn.dev (日本語開発者コミュニティ) ---
    {'url': 'https://zenn.dev/topics/ai/feed',        'source': 'Zenn.dev',  'source_url': 'https://zenn.dev', 'filter': False},
    {'url': 'https://zenn.dev/topics/llm/feed',       'source': 'Zenn.dev',  'source_url': 'https://zenn.dev', 'filter': False},
    {'url': 'https://zenn.dev/topics/chatgpt/feed',   'source': 'Zenn.dev',  'source_url': 'https://zenn.dev', 'filter': False},
    {'url': 'https://zenn.dev/topics/openai/feed',    'source': 'Zenn.dev',  'source_url': 'https://zenn.dev', 'filter': False},
    {'url': 'https://zenn.dev/topics/claude/feed',    'source': 'Zenn.dev',  'source_url': 'https://zenn.dev', 'filter': False},
    {'url': 'https://zenn.dev/topics/gemini/feed',    'source': 'Zenn.dev',  'source_url': 'https://zenn.dev', 'filter': False},
    # --- Qiita (日本語開発者コミュニティ) ---
    {'url': 'https://qiita.com/tags/ai/feed',         'source': 'Qiita',     'source_url': 'https://qiita.com', 'filter': False},
    {'url': 'https://qiita.com/tags/chatgpt/feed',    'source': 'Qiita',     'source_url': 'https://qiita.com', 'filter': False},
    {'url': 'https://qiita.com/tags/llm/feed',        'source': 'Qiita',     'source_url': 'https://qiita.com', 'filter': False},
    {'url': 'https://qiita.com/tags/openai/feed',     'source': 'Qiita',     'source_url': 'https://qiita.com', 'filter': False},
    # --- 総合テックニュース（AIキーワードでフィルタ）---
    {'url': 'https://gigazine.net/news/rss_2.0/',     'source': 'Gigazine',  'source_url': 'https://gigazine.net', 'filter': True},
    {'url': 'https://ascii.jp/rss/',                  'source': 'ASCII.jp',  'source_url': 'https://ascii.jp',    'filter': True},
    {'url': 'https://rss.itmedia.co.jp/rss/2.0/itmedia_news.xml',
                                                      'source': 'ITmedia',   'source_url': 'https://www.itmedia.co.jp', 'filter': True},
]

# AIキーワード（総合ソースのフィルタリング用）
AI_KEYWORDS = [
    'AI', '人工知能', 'ChatGPT', 'GPT', 'LLM', '大規模言語モデル',
    'Claude', 'Gemini', 'Copilot', '生成AI', '機械学習', 'ディープラーニング',
    '深層学習', 'OpenAI', 'Anthropic', '画像生成', 'Stable Diffusion',
    'Midjourney', 'Sora', 'チャットボット', '自然言語処理',
]

# カテゴリ判定キーワード
CATEGORY_RULES = [
    ('LLM',   ['LLM', 'GPT', 'Claude', 'Gemini', '言語モデル', 'ChatGPT', 'Copilot',
                'Llama', 'Mistral', '大規模言語', 'トークン', 'プロンプト', 'RAG']),
    ('画像生成', ['画像生成', 'Stable Diffusion', 'Midjourney', 'DALL-E', 'Sora',
                 '動画生成', 'テキスト→画像', 'image generation', 'Flux', 'ComfyUI']),
    ('研究',   ['研究', '論文', 'arXiv', '学術', 'ベンチマーク', '精度', '実験', '手法']),
    ('規制',   ['規制', '法律', '政策', 'ガイドライン', '倫理', 'リスク', '安全', '著作権', '訴訟']),
    ('ビジネス', ['投資', '資金調達', '買収', '提携', 'IPO', '売上', '収益', '評価額']),
    ('製品',   ['リリース', '新機能', 'アップデート', 'サービス', '発売', 'ローンチ', '新モデル', '公開']),
]

# ============================================================
# ユーティリティ
# ============================================================

def clean_html(text: str) -> str:
    text = re.sub(r'<[^>]+>', '', text or '')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def truncate(text: str, max_len: int = 130) -> str:
    return text[:max_len] + '…' if len(text) > max_len else text

def make_id(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()[:12]

def parse_date(entry) -> datetime:
    for attr in ('published_parsed', 'updated_parsed'):
        val = getattr(entry, attr, None)
        if val:
            return datetime(*val[:6], tzinfo=timezone.utc).astimezone(JST)
    return datetime.now(JST)

def is_ai_related(title: str, summary: str) -> bool:
    text = title + ' ' + summary
    return any(kw.lower() in text.lower() for kw in AI_KEYWORDS)

def detect_category(title: str, summary: str) -> str:
    text = title + ' ' + summary
    for cat, keywords in CATEGORY_RULES:
        if any(kw.lower() in text.lower() for kw in keywords):
            return cat
    return 'その他'

# ============================================================
# メイン処理
# ============================================================

def fetch_articles() -> list[dict]:
    articles = []
    seen_ids: set[str] = set()
    cutoff = datetime.now(JST) - timedelta(days=30)

    for cfg in RSS_SOURCES:
        try:
            feed = feedparser.parse(cfg['url'])
            for entry in feed.entries:
                url = entry.get('link', '').strip()
                if not url:
                    continue

                art_id = make_id(url)
                if art_id in seen_ids:
                    continue

                title   = clean_html(entry.get('title', ''))
                raw_sum = entry.get('summary', entry.get('description', ''))
                summary = truncate(clean_html(raw_sum))

                if cfg['filter'] and not is_ai_related(title, summary):
                    continue

                pub_dt = parse_date(entry)
                if pub_dt < cutoff:
                    continue

                seen_ids.add(art_id)
                articles.append({
                    'id':         art_id,
                    'title':      title,
                    'summary':    summary,
                    'source':     cfg['source'],
                    'source_url': cfg['source_url'],
                    'url':        url,
                    'category':   detect_category(title, summary),
                    'date':       pub_dt.strftime('%Y-%m-%d'),
                    'datetime':   pub_dt.isoformat(),
                })
        except Exception as e:
            print(f'[WARN] {cfg["url"]}: {e}')

    articles.sort(key=lambda x: x['datetime'], reverse=True)
    return articles


def save_data(articles: list[dict], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    now_str = datetime.now(JST).isoformat()

    # articles.json（全記事、最大200件）
    with open(output_dir / 'articles.json', 'w', encoding='utf-8') as f:
        json.dump({'updated': now_str, 'articles': articles[:200]}, f, ensure_ascii=False, indent=2)

    # 日別 JSON
    by_date: dict[str, list] = {}
    for art in articles:
        by_date.setdefault(art['date'], []).append(art)

    for date_str, day_arts in by_date.items():
        with open(output_dir / f'{date_str}.json', 'w', encoding='utf-8') as f:
            json.dump({'date': date_str, 'articles': day_arts}, f, ensure_ascii=False, indent=2)

    # archive.json（日付インデックス）
    archive = [{'date': d, 'count': len(a)} for d, a in sorted(by_date.items(), reverse=True)]
    with open(output_dir / 'archive.json', 'w', encoding='utf-8') as f:
        json.dump(archive, f, ensure_ascii=False, indent=2)

    print(f'✅ {len(articles)} 件の記事を {len(by_date)} 日分保存しました')


def main():
    output_dir = Path(__file__).parent.parent / 'ai-news' / 'data'
    articles = fetch_articles()
    save_data(articles, output_dir)


if __name__ == '__main__':
    main()
