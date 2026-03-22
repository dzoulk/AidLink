import asyncio
import json
import os
import time
import uuid
import random
from datetime import datetime, timezone
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from google import genai
import shutil

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# ── Configurable thresholds ──────────────────────────────────────────────────
CRITICALITY_THRESHOLDS = {
    "critical":      24,   # hours
    "needs_support": 72,   # hours
    # beyond needs_support = "cleanup"
}

CASUALTIES = {
    "few":  10,   # < 10
    "some": 50,   # 10–50
    # > 50 = "many"
}

MANPOWER = {
    "small":    5,    # < 5
    "moderate": 20,   # 5–20
    # > 20 = "large"
}

VERIFICATION = {
    "initial":   3,   # 1–3 posts
    "confident": 8,   # 4–8 posts
    # 9+ = "verified"
}

# ── Region definitions ───────────────────────────────────────────────────────
REGIONS = {
    "gaza": {
        "name":          "Gaza Strip, Palestine",
        "incidents_dir": "incidents/gaza",
        "bounds": {
            "lat_min": 31.2167,
            "lat_max": 31.5985,
            "lon_min": 34.2167,
            "lon_max": 34.5765,
            "center":  {"lat": 31.4, "lon": 34.35},
        },
        "query_prompt": """
You are generating Twitter/X search queries to find building collapse reports in Gaza.

Generate 6 queries total. Split by language — do NOT mix Arabic and English in the same query.

Rules:
- 3 queries in Arabic only, 3 queries in English only
- Every query must contain a location term: Arabic queries use غزة, English queries use Gaza
- Use simple flat keyword combinations — do NOT use nested parentheses
- Format: keyword1 OR keyword2 OR keyword3 locationterm -is:retweet lang:xx -exclusions
- Use lang:ar for Arabic queries, lang:en for English queries
- Focus ONLY on: building collapse, trapped in rubble, rescue from debris
- Arabic collapse terms: انهيار, أنقاض, تحت الأنقاض, عالقون, ضحايا الانهيار, إنقاذ
- English collapse terms: "building collapse", "trapped rubble", "under debris", "rescue rubble", "collapsed building"
- Exclusions for every query: -donate -GoFundMe -hospital -sick -fundraise
- Max 500 characters per query
- Return ONLY a JSON array of strings, nothing else. No explanation, no markdown.
- Location term (Gaza/غزة or Iran/ایران) must be the FIRST word in every query
- Arabic queries must pair انهيار with مبنى (building) or ساختمان
- Do NOT use انهيار alone — it matches economic/emotional collapse
- Use compound terms: "انهيار مبنى" OR "انهيار منزل" OR "انهيار بناء"

Example Arabic: غزة انهيار OR أنقاض OR عالقون -is:retweet lang:ar -donate -GoFundMe -hospital
Example English: Gaza \"building collapse\" OR \"trapped rubble\" OR \"under debris\" -is:retweet lang:en -donate -GoFundMe -hospital
        """
    },
    "iran": {
        "name":          "Iran",
        "incidents_dir": "incidents/iran",
        "bounds": {
            "lat_min": 25.0,
            "lat_max": 39.8,
            "lon_min": 44.0,
            "lon_max": 63.3,
            "center":  {"lat": 32.4, "lon": 53.7},
        },
        "query_prompt": """
You are generating Twitter/X search queries to find building collapse reports in Iran.

Generate 6 queries total. Split by language — do NOT mix Persian and English in the same query.

Rules:
- 3 queries in Persian/Farsi only, 3 queries in English only
- Every query must contain a location term: Persian queries use ایران, English queries use Iran
- Use simple flat keyword combinations — do NOT use nested parentheses
- Format: keyword1 OR keyword2 OR keyword3 locationterm -is:retweet lang:xx -exclusions
- Use lang:fa for Persian queries, lang:en for English queries
- Focus ONLY on: building collapse, trapped in rubble, rescue from debris, earthquake collapse
- Persian collapse terms: ریزش, آوار, زیر آوار, گیر افتاده, ساختمان ریزش, نجات, زلزله
- English collapse terms: "building collapse", "trapped rubble", "earthquake collapse", "under debris", "rescue rubble"
- Exclusions for every query: -donate -GoFundMe -hospital -Israel -Arad -Dimona -missile -strikes -ballistic
- Max 500 characters per query
- Return ONLY a JSON array of strings, nothing else. No explanation, no markdown.
- Location term (Gaza/غزة or Iran/ایران) must be the FIRST word in every query


Example Persian: ایران ریزش OR آوار OR زیر آوار -is:retweet lang:fa -donate -GoFundMe -hospital -Israel -Arad -Dimona -missile -strikes -ballistic
Example English: Iran \"building collapse\" OR \"trapped rubble\" OR \"earthquake collapse\" -is:retweet lang:en -donate -GoFundMe -hospital -Israel -Arad -Dimona -missile -strikes -ballistic
        """
    }
}

# ── Helpers ──────────────────────────────────────────────────────────────────

async def safe_goto(page, url: str, retries: int = 3) -> bool:
    for attempt in range(retries):
        await page.goto(url)
        await page.wait_for_timeout(random.randint(3000, 6000))
        
        # Check for error page
        content = await page.content()
        if "something went wrong" in content.lower() or "try reloading" in content.lower():
            wait = 15 * (attempt + 1)
            print(f"  ⚠️  X error page detected, waiting {wait}s... (attempt {attempt+1}/{retries})")
            await page.wait_for_timeout(wait * 1000)
            await page.reload()
            await page.wait_for_timeout(3000)
        else:
            return True
    return False

def prefilter_tweets(tweets: list[dict], region_key: str) -> list[dict]:
    """Quick keyword filter before sending to Gemini — reduces noise and saves tokens."""
    
    REGION_FILTERS = {
        "gaza": {
            "must_contain": ["غزة", "gaza", "Gaza", "انهيار مبنى", "انهيار منزل", 
                           "تحت الأنقاض", "building collapse", "trapped rubble", 
                           "under debris", "collapsed building"],
            "must_exclude": ["اقتصاد", "اقتصادي", "نفسي", "emotional", "economic",
                           "stock", "market", "currency"],
        },
        "iran": {
            "must_contain": ["ایران", "iran", "Iran", "ریزش ساختمان", "زیر آوار",
                           "building collapse", "trapped rubble", "earthquake collapse"],
            "must_exclude": ["missile", "ballistic", "Arad", "Dimona", "Israel",
                           "موشک", "اسرائیل", "political", "سیاسی"],
        }
    }
    
    filters     = REGION_FILTERS.get(region_key, {})
    must_contain = filters.get("must_contain", [])
    must_exclude = filters.get("must_exclude", [])
    
    filtered = []
    for t in tweets:
        text = t["text"].lower()
        has_signal = any(kw.lower() in text for kw in must_contain)
        has_noise  = any(kw.lower() in text for kw in must_exclude)
        if has_signal and not has_noise:
            filtered.append(t)
    
    print(f"  🔽 Pre-filter: {len(tweets)} → {len(filtered)} tweets")
    return filtered

def incidents_file(region_key: str) -> str:
    return f"{REGIONS[region_key]['incidents_dir']}/latest.json"

def hours_since(iso_timestamp: str) -> float:
    try:
        dt = datetime.fromisoformat(iso_timestamp.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - dt).total_seconds() / 3600
    except:
        return 0

def get_criticality(hours: float) -> str:
    if hours <= CRITICALITY_THRESHOLDS["critical"]:
        return "critical"
    elif hours <= CRITICALITY_THRESHOLDS["needs_support"]:
        return "needs_support"
    return "cleanup"

def get_casualties_category(count: int) -> str:
    if count < CASUALTIES["few"]:
        return "few"
    elif count < CASUALTIES["some"]:
        return "some"
    return "many"

def get_manpower_category(count: int) -> str:
    if count < MANPOWER["small"]:
        return "small"
    elif count < MANPOWER["moderate"]:
        return "moderate"
    return "large"

def get_verification(post_count: int) -> str:
    if post_count <= VERIFICATION["initial"]:
        return "initial_reports"
    elif post_count <= VERIFICATION["confident"]:
        return "confident"
    return "verified"

def is_in_region(lat: float, lon: float, region_key: str) -> bool:
    b = REGIONS[region_key]["bounds"]
    return b["lat_min"] <= lat <= b["lat_max"] and b["lon_min"] <= lon <= b["lon_max"]

def load_incidents(region_key: str) -> list[dict]:
    path = incidents_file(region_key)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_incidents(incidents: list[dict], region_key: str):
    dir_path    = REGIONS[region_key]["incidents_dir"]
    os.makedirs(dir_path, exist_ok=True)

    timestamp   = datetime.now().strftime("%Y%m%d_%H%M%S")
    timestamped = f"{dir_path}/incidents_{timestamp}.json"
    latest      = incidents_file(region_key)

    with open(timestamped, "w", encoding="utf-8") as f:
        json.dump(incidents, f, ensure_ascii=False, indent=2)

    with open(latest, "w", encoding="utf-8") as f:
        json.dump(incidents, f, ensure_ascii=False, indent=2)

    print(f"\n💾 [{region_key.upper()}] Saved {len(incidents)} incidents")
    print(f"   📄 Timestamped: {timestamped}")
    print(f"   📄 Latest:      {latest}")

# ── Gemini ───────────────────────────────────────────────────────────────────
def call_gemini(prompt: str) -> str:
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            if "429" in str(e):
                wait = 60 * (attempt + 1)
                print(f"  ⏳ Rate limited. Waiting {wait}s... (attempt {attempt+1}/3)")
                time.sleep(wait)
            else:
                raise e
    raise Exception("Gemini failed after 3 retries")

# ── STEP 1: Generate queries ─────────────────────────────────────────────────
def generate_queries(region_key: str) -> list[str]:
    text    = call_gemini(REGIONS[region_key]["query_prompt"]).replace("```json", "").replace("```", "").strip()
    queries = json.loads(text)
    print(f"\n✅ [{region_key.upper()}] Gemini generated {len(queries)} queries:")
    for q in queries:
        print(f"   • {q}")
    return queries

# ── STEP 2: Scrape X ─────────────────────────────────────────────────────────
async def scrape_twitter(queries: list[str], region_key: str, page, max_per_query: int = 15) -> list[dict]:
    all_tweets = []

    for query in queries:
        print(f"\n🔍 [{region_key.upper()}] Scraping: {query[:70]}...")
        encoded = query.replace(" ", "%20").replace("#", "%23").replace(":", "%3A")
        url     = f"https://x.com/search?q={encoded}&src=typed_query&f=live"

        success = await safe_goto(page, url)
        if not success:
            print(f"  ❌ Skipping query after repeated errors")
            continue

        tweets_found = 0
        last_height  = 0

        while tweets_found < max_per_query:
            elements = await page.query_selector_all('article[data-testid="tweet"]')

            for el in elements:
                if tweets_found >= max_per_query:
                    break
                try:
                    text_el  = await el.query_selector('[data-testid="tweetText"]')
                    time_el  = await el.query_selector("time")
                    link_el  = await el.query_selector('a[href*="/status/"]')

                    if not text_el:
                        continue

                    text      = await text_el.inner_text()
                    timestamp = await time_el.get_attribute("datetime") if time_el else None
                    link      = await link_el.get_attribute("href") if link_el else None
                    post_url  = f"https://x.com{link}" if link else None

                    media     = []
                    img_els   = await el.query_selector_all('img[src*="pbs.twimg.com/media"]')
                    video_els = await el.query_selector_all('video')
                    for img in img_els:
                        src = await img.get_attribute("src")
                        if src:
                            media.append({"type": "image", "url": src})
                    for vid in video_els:
                        src = await vid.get_attribute("src")
                        if src:
                            media.append({"type": "video", "url": src})

                    if not any(t["post_url"] == post_url for t in all_tweets):
                        all_tweets.append({
                            "text":       text,
                            "timestamp":  timestamp,
                            "post_url":   post_url,
                            "media":      media,
                            "query_used": query,
                            "scraped_at": datetime.utcnow().isoformat(),
                        })
                        tweets_found += 1
                        print(f"   [{tweets_found}] {text[:80]}...")
                except:
                    continue

            current_height = await page.evaluate("document.body.scrollHeight")
            if current_height == last_height:
                break
            last_height = current_height
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(random.randint(8000, 15000))

    print(f"\n📦 [{region_key.upper()}] Total tweets scraped: {len(all_tweets)}")
    return all_tweets

# ── STEP 3: Cluster tweets into incidents ─────────────────────────────────────
def cluster_into_incidents(tweets: list[dict], existing: list[dict], region_key: str) -> list[dict]:
    if not tweets:
        return []

    bounds      = REGIONS[region_key]["bounds"]
    region_name = REGIONS[region_key]["name"]

    tweets_text   = json.dumps([{
        "text":      t["text"],
        "timestamp": t["timestamp"],
        "post_url":  t["post_url"],
        "media":     t["media"],
    } for t in tweets], ensure_ascii=False)

    existing_text = json.dumps([{
        "incident_id": i["incident_id"],
        "summary":     i.get("summary", ""),
        "location":    i.get("location_centre", {}),
        "first_seen":  i.get("time_of_incident", ""),
    } for i in existing], ensure_ascii=False)

    prompt = f"""
You are a humanitarian crisis analyst for {region_name}. Cluster these tweets about
building collapses and people trapped in rubble into discrete incidents.

Region bounding box: lat {bounds['lat_min']}–{bounds['lat_max']}, lon {bounds['lon_min']}–{bounds['lon_max']}
Region center (use if location unknown): {bounds['center']}

EXISTING INCIDENTS (do not duplicate):
{existing_text}

NEW TWEETS:
{tweets_text}

RULES:
1. Only include tweets about building collapses or people trapped in rubble in {region_name}
2. Ignore: donations, GoFundMe, illness, sickness, general commentary, politics
3. Group tweets about the same incident together
4. Match to existing incidents where possible (same location + time window)
5. All coordinates MUST be within the bounding box
6. location_centre: triangulate from place names using your knowledge of local geography.
   If uncertain use region center {bounds['center']}
7. location_radius_km: 0.1 = single building, 0.5 = neighborhood, 2.0 = district
8. casualties_estimate: use numbers from tweets, or estimate from building type + time of day + density
9. manpower_needed_estimate: estimate responders needed from casualties + radius
10. time_of_incident: earliest tweet timestamp (ISO format)
11. Updates to existing incidents: set is_update true and include the existing incident_id

Return a JSON array. Each object must have exactly these fields:
{{
  "incident_id": "existing ID if update, else null",
  "is_update": true/false,
  "summary": "one sentence in English",
  "location_centre": {{"lat": float, "lon": float}},
  "location_radius_km": float,
  "casualties_estimate": integer,
  "manpower_needed_estimate": integer,
  "time_of_incident": "ISO timestamp",
  "post_urls": ["url1", "url2"],
  "media_urls": [{{"type": "image|video", "url": "..."}}],
  "location_source": "gemini",
  "casualties_source": "gemini",
  "manpower_source": "gemini"
}}

Return ONLY valid JSON array, no markdown, no explanation.
    """

    text      = call_gemini(prompt).replace("```json", "").replace("```", "").strip()
    clustered = json.loads(text)
    print(f"\n🤖 [{region_key.upper()}] Gemini identified {len(clustered)} incident clusters")
    return clustered

# ── STEP 4: Merge into incidents list ─────────────────────────────────────────
def merge_incidents(clustered: list[dict], existing: list[dict], region_key: str) -> list[dict]:
    incidents = {i["incident_id"]: i for i in existing}

    for c in clustered:
        loc = c.get("location_centre", {})
        lat = loc.get("lat", 0)
        lon = loc.get("lon", 0)

        if not is_in_region(lat, lon, region_key):
            print(f"  ⚠️  Skipping — outside {region_key} bounds: {lat}, {lon}")
            continue

        existing_id = c.get("incident_id")
        is_update   = c.get("is_update", False)

        if is_update and existing_id and existing_id in incidents:
            inc = incidents[existing_id]
            print(f"  🔄 Updating incident {existing_id[:8]}...")

            existing_urls = set(inc.get("posts", []))
            new_urls      = set(c.get("post_urls", []))
            inc["posts"]  = list(existing_urls | new_urls)

            existing_media = {m["url"]: m for m in inc.get("media", [])}
            for m in c.get("media_urls", []):
                existing_media[m["url"]] = m
            inc["media"] = list(existing_media.values())

            for field, source_field in [
                ("location_centre",         "location_source"),
                ("location_radius_km",       "location_source"),
                ("casualties_estimate",      "casualties_source"),
                ("manpower_needed_estimate", "manpower_source"),
            ]:
                if inc.get(source_field) != "human_verified":
                    inc[field]        = c.get(field, inc.get(field))
                    inc[source_field] = "gemini"

            post_count                 = len(inc["posts"])
            hours                      = hours_since(inc["time_of_incident"])
            inc["criticality"]         = get_criticality(hours)
            inc["time_since_incident"] = f"{hours:.1f}h"
            inc["verification"]        = get_verification(post_count)
            inc["casualties"]          = get_casualties_category(inc.get("casualties_estimate", 0))
            inc["manpower_needed"]     = get_manpower_category(inc.get("manpower_needed_estimate", 0))
            inc["last_updated"]        = datetime.utcnow().isoformat()

        else:
            new_id  = str(uuid.uuid4())
            hours   = hours_since(c.get("time_of_incident", datetime.utcnow().isoformat()))
            posts   = c.get("post_urls", [])
            center  = REGIONS[region_key]["bounds"]["center"]

            inc = {
                "incident_id":              new_id,
                "region":                   region_key,
                "summary":                  c.get("summary", ""),
                "time_of_incident":         c.get("time_of_incident", datetime.utcnow().isoformat()),
                "time_since_incident":      f"{hours:.1f}h",
                "criticality":              get_criticality(hours),
                "location_centre":          c.get("location_centre", center),
                "location_radius_km":       c.get("location_radius_km", 0.5),
                "location_source":          "gemini",
                "casualties_estimate":      c.get("casualties_estimate", 0),
                "casualties":               get_casualties_category(c.get("casualties_estimate", 0)),
                "casualties_source":        "gemini",
                "manpower_needed_estimate": c.get("manpower_needed_estimate", 0),
                "manpower_needed":          get_manpower_category(c.get("manpower_needed_estimate", 0)),
                "manpower_source":          "gemini",
                "verification":             get_verification(len(posts)),
                "posts":                    posts,
                "media":                    c.get("media_urls", []),
                "last_updated":             datetime.utcnow().isoformat(),
            }
            incidents[new_id] = inc
            print(f"  ✅ New incident: {inc['summary'][:60]}...")

    return list(incidents.values())

# ── STEP 5: Refresh time-based fields ─────────────────────────────────────────
def refresh_time_fields(incidents: list[dict]) -> list[dict]:
    for inc in incidents:
        hours = hours_since(inc["time_of_incident"])
        inc["time_since_incident"] = f"{hours:.1f}h"
        inc["criticality"]         = get_criticality(hours)
    return incidents

# ── Process one region ─────────────────────────────────────────────────────────
async def process_region(region_key: str, page):
    print(f"\n{'=' * 60}")
    print(f"🌍 Processing: {REGIONS[region_key]['name']}")
    print(f"{'=' * 60}")

    existing  = load_incidents(region_key)
    print(f"📂 Loaded {len(existing)} existing incidents")

    queries   = generate_queries(region_key)
    tweets    = await scrape_twitter(queries, region_key, page)
    tweets    = prefilter_tweets(tweets, region_key)

    if not tweets:
        print(f"❌ [{region_key.upper()}] No tweets scraped")
        existing = refresh_time_fields(existing)
        save_incidents(existing, region_key)
        return existing

    clustered = cluster_into_incidents(tweets, existing, region_key)
    updated   = merge_incidents(clustered, existing, region_key)
    updated   = refresh_time_fields(updated)
    save_incidents(updated, region_key)

    print(f"\n📊 [{region_key.upper()}] Summary:")
    for inc in sorted(updated, key=lambda x: x["time_of_incident"], reverse=True):
        print(f"  [{inc['criticality'].upper()}] {inc['summary'][:55]}...")
        print(f"    📍 {inc['location_centre']} ±{inc['location_radius_km']}km")
        print(f"    👥 Casualties: {inc['casualties']} | 🔧 Manpower: {inc['manpower_needed']}")
        print(f"    🕐 {inc['time_since_incident']} ago | ✅ {inc['verification']} ({len(inc['posts'])} posts)")

    return updated

# ── Main ──────────────────────────────────────────────────────────────────────
async def main():
    # Add or remove regions here as needed
    regions_to_run = ["gaza", "iran"]

    print("=" * 60)
    print("🚨 Multi-Region Crisis Incident Tracker")
    print(f"   Regions: {', '.join(r.upper() for r in regions_to_run)}")
    print("=" * 60)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )

        with open("x_cookies.json") as f:
            cookies = json.load(f)
        await context.add_cookies(cookies)

        page = await context.new_page()
        print("\n⏳ Loading X...")
        await page.goto("https://x.com/home")
        await page.wait_for_timeout(3000)

        if "login" in page.url:
            print("❌ Cookies expired — re-run get_cookies.py")
            await browser.close()
            return

        print("✅ Logged in!")

        for region_key in regions_to_run:
            await process_region(region_key, page)

        await browser.close()

    print("\n✅ All regions processed.")

if __name__ == "__main__":
    asyncio.run(main())