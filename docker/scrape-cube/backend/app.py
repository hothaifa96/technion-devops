import os
import logging
from urllib.parse import quote_plus, unquote, parse_qs

import requests
from bs4 import BeautifulSoup
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)


def _extract_real_url(ddg_redirect):
    """DuckDuckGo links are redirects; try to return the real destination."""
    if not ddg_redirect:
        return ""

    from urllib.parse import urlparse
    parsed = urlparse(ddg_redirect if ddg_redirect.startswith("http") else "https:" + ddg_redirect)

    if "uddg" in parsed.query:
        return unquote(parse_qs(parsed.query)["uddg"][0])
    return ddg_redirect


def web_search(query, num_results=10):
    """Scrape DuckDuckGo HTML search results."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    }
    url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    results = []

    for row in soup.select(".result"):
        title_tag = row.select_one(".result__a")
        snippet_tag = row.select_one(".result__snippet")

        if not title_tag:
            continue

        link = _extract_real_url(title_tag.get("href", ""))
        results.append({
            "title": title_tag.get_text(strip=True),
            "link": link,
            "snippet": snippet_tag.get_text(strip=True) if snippet_tag else "",
        })

    return results[:num_results]


@app.route("/api/search", methods=["GET"])
def search():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400

    try:
        results = web_search(query)
        return jsonify({
            "query": query,
            "count": len(results),
            "results": results,
            "volume": os.environ.get("VOLUME_PATH", "/data"),
            "backend_url": request.url_root,
        })
    except Exception as e:
        app.logger.exception("Search failed")
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok yeah yeahgnejlg ekgbewig fkewlgewp yeah"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
