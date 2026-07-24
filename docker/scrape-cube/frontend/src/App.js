import { useState } from "react";
import "./App.css";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const faces = ["front", "back", "right", "left", "top", "bottom"];

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResults([]);
    setMeta(null);

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`,
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data.results || []);
      setMeta({
        count: data.count,
        volume: data.volume,
        backendUrl: data.backend_url,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cubeResults = results.slice(0, 6);

  return (
    <div className='app'>
      <h1>Scrape Cube</h1>
      <p className='subtitle'>Web search results in a 3D cube</p>

      <form className='search-box' onSubmit={handleSearch}>
        <input
          type='text'
          placeholder='Enter a search word...'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type='submit' disabled={loading}>
          {loading ? "Scraping..." : "Search"}
        </button>
      </form>

      {error && <div className='error'>{error}</div>}

      {meta && (
        <div className='meta'>
          Found {meta.count} results for "{query}"
        </div>
      )}

      {cubeResults.length > 0 && (
        <div className='scene'>
          <div className='cube'>
            {cubeResults.map((result, index) => (
              <div key={index} className={`face ${faces[index]}`}>
                <h3 title={result.title}>{result.title}</h3>
                <p>{result.snippet || "No snippet available."}</p>
                <a href={result.link} target='_blank' rel='noreferrer'>
                  {result.link}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length > 6 && (
        <div className='results-list'>
          {results.slice(6).map((result, index) => (
            <div key={index} className='result-card'>
              <h3>{result.title}</h3>
              <p>{result.snippet || "No snippet available."}</p>
              <a href={result.link} target='_blank' rel='noreferrer'>
                {result.link}
              </a>
            </div>
          ))}
        </div>
      )}

      {meta && (
        <div className='info-bar'>
          <span>
            <strong>Volume:</strong> {meta.volume}
          </span>
          <span>
            <strong>Backend URL:</strong> {meta.backendUrl}
          </span>
        </div>
      )}

      {!loading && results.length === 0 && query && !error && (
        <p className='no-results'>No results found.</p>
      )}
    </div>
  );
}

export default App;
