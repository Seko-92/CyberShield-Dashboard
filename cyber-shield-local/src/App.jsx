import React, { useState, useCallback } from 'react';
import {
  Link, FileText, Search, Mail, Loader2, Zap, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';

// --- CONFIGURATION ---
// IMPORTANT: Update this BASE_URL to match where your FastAPI backend is running
const BASE_URL = 'http://127.0.0.1:8000';
// --- CONFIGURATION ---

// --- UTILITY COMPONENTS ---

// Loading Spinner Component
const LoadingSpinner = ({ message = "Processing request..." }) => (
  <div className="flex items-center justify-center p-4 text-indigo-600">
    <Loader2 className="w-6 h-6 animate-spin mr-3" />
    <span className="font-medium">{message}</span>
  </div>
);

// Result Card Component
const ResultCard = ({ title, status, details, Icon, colorClass, summary, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Determine indicator color based on status
  let indicatorColor = 'bg-gray-400';
  if (status === 'DANGER' || status === 'error') {
    indicatorColor = 'bg-red-500';
  } else if (status === 'WARNING' || status === 'PENDING') {
    indicatorColor = 'bg-yellow-500';
  } else if (status === 'CLEAN' || status === 'completed' || status === 'success') {
    indicatorColor = 'bg-green-500';
  }

  // Clean up JSON for display
  const cleanDetails = JSON.stringify(details, (key, value) => {
    if (value === null || value === undefined) {
      return "(N/A)";
    }
    return value;
  }, 2);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-6 transition duration-300 hover:shadow-xl">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${colorClass} text-white`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{summary}</p>
            </div>
          </div>
          <div className={`mt-1 px-3 py-1 text-xs font-bold rounded-full text-white ${indicatorColor}`}>
            {status}
          </div>
        </div>

        {/* Child content, used primarily for Breach List */}
        {children}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition duration-150"
        >
          {isOpen ? 'Hide Detailed JSON' : 'Show Detailed JSON'}
        </button>

        {isOpen && (
          <pre className="mt-3 p-4 bg-gray-50 rounded-lg text-xs overflow-x-auto border border-gray-200">
            {cleanDetails}
          </pre>
        )}
      </div>
    </div>
  );
};

// Error Message Component
const ErrorMessage = ({ message }) => (
  <div className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl flex items-center space-x-2">
    <XCircle className="w-5 h-5 flex-shrink-0" />
    <span className="font-medium">Error: {message}</span>
  </div>
);


// --- TAB CONTENT COMPONENTS ---

const UrlScanner = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (e) {
      setError(`Failed to connect to backend: ${e.message}. Ensure the FastAPI server is running at ${BASE_URL}.`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [url]);

  return (
    <div className="space-y-6">
      <form onSubmit={handleScan} className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <input
          type="url"
          placeholder="Enter URL (e.g., https://malware.testing.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="flex-shrink-0 flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:opacity-50"
        >
          <Link className="w-5 h-5" />
          <span>Scan URL</span>
        </button>
      </form>

      {loading && <LoadingSpinner message="Scanning URL and analyzing multiple sources..." />}
      {error && <ErrorMessage message={error} />}
      {result && (
        <ResultCard
          title="URL Scan Results"
          summary={result.overall_summary}
          status={result.overall_summary.split(':')[0]} // Extract DANGER/CLEAN/WARNING
          details={result.details}
          Icon={Link}
          colorClass="bg-indigo-600"
        />
      )}
    </div>
  );
};

const FileScanner = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleScan = useCallback(async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${BASE_URL}/scan-file`, {
        method: 'POST',
        body: formData, // Fetch automatically sets Content-Type for FormData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (e) {
      setError(`Failed to connect to backend: ${e.message}. Ensure the FastAPI server is running at ${BASE_URL}.`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [file]);

  return (
    <div className="space-y-6">
      <form onSubmit={handleScan} className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-center">
        <label className="block w-full sm:w-auto">
          <input
            type="file"
            onChange={handleFileChange}
            required
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </label>

        <button
          type="submit"
          disabled={loading || !file}
          className="flex-shrink-0 flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:opacity-50"
        >
          <FileText className="w-5 h-5" />
          <span>Scan File</span>
        </button>
      </form>

      {loading && <LoadingSpinner message={`Uploading and scanning file: ${file?.name || '...'}`} />}
      {error && <ErrorMessage message={error} />}
      {result && (
        <ResultCard
          title={`File Scan Results: ${result.filename}`}
          summary={result.overall_summary}
          status={result.overall_summary.split(':')[0]}
          details={result.details}
          Icon={FileText}
          colorClass="bg-green-600"
        />
      )}
    </div>
  );
};

const AiQuery = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuery = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/ai-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (e) {
      setError(`Failed to connect to backend: ${e.message}. Ensure the FastAPI server is running at ${BASE_URL}.`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const formatAiResponse = (text, sources) => {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <h4 className="text-lg font-semibold text-blue-800 mb-2">AI Analysis</h4>
          <p className="whitespace-pre-wrap text-gray-700">{text}</p>
        </div>

        {sources && sources.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-md font-semibold text-gray-700 mb-2">Sources Referenced (Gemini Search Grounding)</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              {sources.map((source, index) => (
                <li key={index} className="truncate">
                  <a
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 hover:underline"
                    title={source.uri}
                  >
                    {source.title || source.uri}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleQuery} className="flex flex-col space-y-3">
        <textarea
          placeholder="Ask a cybersecurity question (e.g., 'What is the latest vulnerability in the VMWare product line?')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
          rows="3"
          className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 resize-y"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:opacity-50 self-start sm:self-auto"
        >
          <Search className="w-5 h-5" />
          <span>Get Threat Intelligence</span>
        </button>
      </form>

      {loading && <LoadingSpinner message="Querying Gemini for real-time threat intelligence..." />}
      {error && <ErrorMessage message={error} />}
      {result && formatAiResponse(result.ai_response, result.sources)}
    </div>
  );
};

const EmailChecker = () => {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheck = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (e) {
      setError(`Failed to connect to backend: ${e.message}. Ensure the FastAPI server is running at ${BASE_URL}.`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [email]);

  // Special display for breach list
  const getBreachListDisplay = (breachDetails) => {
    // Note: breachDetails structure is nested under 'details' and 'breach_check'
    const breaches = breachDetails?.breach_check?.breach_list;
    if (!breaches || breaches.length === 0) return null;

    return (
      <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
        <h4 className="font-semibold text-red-800 mb-2 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{breaches.length} Breach{breaches.length > 1 ? 'es' : ''} Found:</span>
        </h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
          {breaches.map((b, index) => (
            <li key={index}>
              <span className="font-medium">{b.name}</span> ({b.date}) - Data Exposed: {b.data}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCheck} className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <input
          type="email"
          placeholder="Enter email address to check for breaches (e.g., test@example.com)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
        />
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="flex-shrink-0 flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:opacity-50"
        >
          <Mail className="w-5 h-5" />
          <span>Check Email</span>
        </button>
      </form>

      {loading && <LoadingSpinner message="Checking breach databases..." />}
      {error && <ErrorMessage message={error} />}
      {result && (
        <ResultCard
          title={`Email Check Results for ${result.email}`}
          summary={result.overall_summary}
          status={result.overall_summary.split(':')[0]}
          details={result.details}
          Icon={Mail}
          colorClass="bg-red-600"
        >
          {getBreachListDisplay(result.details)}
        </ResultCard>
      )}
    </div>
  );
};


// --- MAIN APP COMPONENT ---

const App = () => {
  const [activeTab, setActiveTab] = useState('url'); // 'url', 'file', 'ai', 'email'

  const tabContent = {
    'url': { component: <UrlScanner />, icon: Link, title: 'URL Scanner' },
    'file': { component: <FileScanner />, icon: FileText, title: 'File Scanner' },
    'ai': { component: <AiQuery />, icon: Search, title: 'Threat Intelligence AI' },
    'email': { component: <EmailChecker />, icon: Mail, title: 'Email Breach Checker' },
  };

  const TabButton = ({ id, icon: Icon, title }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-t-xl transition-all duration-200
        ${activeTab === id
          ? 'bg-white text-indigo-600 font-bold shadow-t-lg border-b-4 border-indigo-600'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-indigo-600'
        }`}
    >
      <Icon className="w-5 h-5" />
      <span className="hidden sm:inline">{title}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="p-6 bg-indigo-600 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center space-x-3">
          <Zap className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-extrabold text-white">CyberShield Dashboard</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-gray-50 p-1">
            {Object.keys(tabContent).map(key => (
              <TabButton
                key={key}
                id={key}
                icon={tabContent[key].icon}
                title={tabContent[key].title}
              />
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
              {tabContent[activeTab].title}
            </h2>
            {tabContent[activeTab].component}
          </div>

        </div>
      </main>

      <footer className="max-w-6xl mx-auto p-4 text-center text-sm text-gray-500">
        Powered by React and FastAPI. Backend URL: {BASE_URL}
      </footer>
    </div>
  );
};

export default App;