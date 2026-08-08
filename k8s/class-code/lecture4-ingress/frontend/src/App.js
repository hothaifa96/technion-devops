import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [config, setConfig] = useState(null);
  const [output, setOutput] = useState(
    "Click a button to ping a microservice.",
  );

  useEffect(() => {
    fetch("/config.json")
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(() => {
        // Local dev fallback if public/config.json is not used
        setConfig({
          apiAUrl: "http://localhost:3001",
          apiBUrl: "http://localhost:3002",
        });
      });
  }, []);

  const ping = async (name, url) => {
    setOutput(`Calling ${name} at ${url} ...`);
    try {
      const res = await fetch(`${url}/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOutput(`${name} says:\n${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setOutput(`Error calling ${name}:\n${err.message}`);
    }
  };

  if (!config) {
    return (
      <div className='app'>
        <p className='subtitle'>Loading config...</p>
      </div>
    );
  }

  return (
    <div className='app'>
      <h1>Kubernetes Ingress Demo</h1>
      <p className='subtitle'>
        Frontend calls two microservices through one host via ingress rules.
      </p>

      <div className='cards'>
        <div className='card'>
          <h2>Microservice A</h2>
          <p>Exposed at /api-a</p>
          <button onClick={() => ping("API A", config.apiAUrl)}>
            Ping API A
          </button>
        </div>

        <div className='card'>
          <h2>Microservice B</h2>
          <p>Exposed at /api-b</p>
          <button onClick={() => ping("API B", config.apiBUrl)}>
            Ping API B
          </button>
        </div>
      </div>

      <div className='output'>
        <h3>Response</h3>
        <pre>{output}</pre>
      </div>
    </div>
  );
}

export default App;
