import React, { useState } from 'react';
import { Shield, Activity, Settings, AlertTriangle, Cloud, Zap, Menu, X, BarChart } from 'lucide-react';

// --- Data Structure Placeholder ---
const dashboardData = {
  totalThreats: 1450,
  blockedAttacks: 1289,
  highRiskAlerts: 15,
  networkStatus: 'Optimized',
  recentThreats: [
    { id: 1, type: 'Malware', source: '192.168.1.101', severity: 'High', time: '5m ago' },
    { id: 2, type: 'DDoS Attempt', source: '203.0.113.5', severity: 'Critical', time: '12m ago' },
    { id: 3, type: 'Phishing Email', source: 'User X', severity: 'Medium', time: '30m ago' },
  ],
};

// --- Custom Components ---

const MetricCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 transition duration-300 hover:shadow-xl hover:border-indigo-500/50">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
      <Icon className={`w-6 h-6 ${colorClass}`} />
    </div>
    <p className="mt-2 text-4xl font-extrabold text-white">
      {value}
    </p>
  </div>
);

const ThreatItem = ({ threat }) => {
  const severityColors = {
    Critical: 'text-red-500 bg-red-900/30 border-red-500',
    High: 'text-orange-500 bg-orange-900/30 border-orange-500',
    Medium: 'text-yellow-500 bg-yellow-900/30 border-yellow-500',
  };
  const colorClass = severityColors[threat.severity] || 'text-gray-400 bg-gray-600/30 border-gray-500';

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-700 last:border-b-0">
      <div className="flex-1">
        <p className="font-semibold text-white">{threat.type}</p>
        <p className="text-xs text-gray-500">Source: {threat.source}</p>
      </div>
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colorClass}`}>
        {threat.severity}
      </span>
      <span className="ml-4 text-sm text-gray-500">{threat.time}</span>
    </div>
  );
};

const Sidebar = ({ currentPage, setPage, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart },
    { id: 'threats', label: 'Threats Log', icon: AlertTriangle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const NavLink = ({ id, label, icon: Icon }) => {
    const isActive = currentPage === id;
    const activeClass = isActive ? 'bg-indigo-700 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-white';
    return (
      <a
        href="#"
        onClick={() => {
          setPage(id);
          setIsMobileMenuOpen(false); // Close menu on selection
        }}
        className={`flex items-center p-3 rounded-xl transition duration-200 ${activeClass}`}
      >
        <Icon className="w-5 h-5 mr-3" />
        <span className="font-medium">{label}</span>
      </a>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-gray-900 border-r border-gray-700 p-4">
        <div className="flex items-center mb-10 p-2">
          <Shield className="w-8 h-8 text-indigo-400 mr-3" />
          <h1 className="text-2xl font-bold text-white tracking-wide">CyberShield</h1>
        </div>
        <nav className="space-y-2">
          {navItems.map(item => (
            <NavLink key={item.id} {...item} />
          ))}
        </nav>
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
            <Shield className="w-6 h-6 text-indigo-400 mr-2" />
            <h1 className="text-xl font-bold text-white">CyberShield</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-full text-white bg-gray-700 hover:bg-gray-600 transition"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-gray-900/95 p-6 backdrop-blur-sm">
          <div className="flex justify-end mb-8">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-full text-white bg-gray-700 hover:bg-gray-600 transition"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="space-y-4">
            {navItems.map(item => (
              <NavLink key={item.id} {...item} />
            ))}
          </nav>
        </div>
      )}
    </>
  );
};

// --- Page Views ---

const OverviewPage = () => (
  <div className="p-4 sm:p-8">
    <h2 className="text-3xl font-extrabold text-white mb-6">Dashboard Overview</h2>

    {/* Metrics Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Total Threats Detected"
        value={dashboardData.totalThreats.toLocaleString()}
        icon={Activity}
        colorClass="text-yellow-400"
      />
      <MetricCard
        title="Attacks Blocked"
        value={dashboardData.blockedAttacks.toLocaleString()}
        icon={Shield}
        colorClass="text-green-400"
      />
      <MetricCard
        title="High Risk Alerts"
        value={dashboardData.highRiskAlerts}
        icon={AlertTriangle}
        colorClass="text-red-500"
      />
      <MetricCard
        title="Network Status"
        value={dashboardData.networkStatus}
        icon={Cloud}
        colorClass="text-indigo-400"
      />
    </div>

    {/* Recent Activity and Graphs */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Recent Threats Log */}
      <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Recent Threat Activity
        </h3>
        <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
          {dashboardData.recentThreats.map(threat => (
            <ThreatItem key={threat.id} threat={threat} />
          ))}
           <div className="p-3 text-center text-gray-500">
              (More entries would be loaded here...)
           </div>
        </div>
      </div>

      {/* System Health Status */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 flex flex-col justify-between">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-indigo-400" />
            System Health
        </h3>
        <div className="space-y-4 text-gray-300">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span>CPU Usage:</span>
                <span className="text-green-400 font-medium">18%</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span>Memory Load:</span>
                <span className="text-yellow-400 font-medium">45%</span>
            </div>
            <div className="flex justify-between items-center">
                <span>Disk I/O:</span>
                <span className="text-green-400 font-medium">2 MB/s</span>
            </div>
        </div>
        <button className="mt-6 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition duration-200 shadow-md">
            Run Full System Scan
        </button>
      </div>
    </div>
  </div>
);

const ThreatsLogPage = () => (
    <div className="p-4 sm:p-8">
        <h2 className="text-3xl font-extrabold text-white mb-6">Full Threats Log</h2>
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <p className="text-gray-400">This page would typically feature a table with filtering and sorting capabilities for all historical threat data.</p>
            <div className="mt-4 p-4 bg-gray-900 rounded-lg text-gray-500">
                [Placeholder for Data Table Component]
                <div className="h-64 flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 text-red-500 mr-2" />
                    Detailed Log View Coming Soon...
                </div>
            </div>
        </div>
    </div>
);

const SettingsPage = () => (
    <div className="p-4 sm:p-8">
        <h2 className="text-3xl font-extrabold text-white mb-6">Security Settings</h2>
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 max-w-2xl">
            <p className="text-gray-300 mb-4">Manage your firewall rules and security policies here.</p>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-white">Firewall Active</span>
                    <input type="checkbox" className="h-5 w-5 rounded form-checkbox text-indigo-600 bg-gray-600 border-gray-500 focus:ring-indigo-500" defaultChecked />
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-white">Automatic Updates</span>
                    <input type="checkbox" className="h-5 w-5 rounded form-checkbox text-indigo-600 bg-gray-600 border-gray-500 focus:ring-indigo-500" />
                </div>
                <button className="mt-4 px-6 py-2 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition duration-200">
                    Apply Changes
                </button>
            </div>
        </div>
    </div>
);


// --- Main App Component ---
export default function App() {
  const [currentPage, setCurrentPage] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage />;
      case 'threats':
        return <ThreatsLogPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-900 font-inter">

      {/* Sidebar Navigation (Conditional Rendering for Mobile) */}
      <Sidebar
        currentPage={currentPage}
        setPage={setCurrentPage}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full">
        {renderPage()}
      </main>

      {/* Tailwind and Inter Font loading script (for reference, assumes external load in actual environment) */}
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
          .font-inter { font-family: 'Inter', sans-serif; }
          /* Fix for default checkbox styling in React */
          input[type="checkbox"] { appearance: none; -webkit-appearance: none; border-width: 1px; border-style: solid; }
        `}
      </style>
    </div>
  );
}