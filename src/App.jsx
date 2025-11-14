import React, { useState } from 'react';
import { Shield, LayoutDashboard, Database, Settings, ArrowRight, Menu, X, Bell, User, Cpu, BarChart3 } from 'lucide-react';

// --- Utility Components ---

/**
 * A reusable card component for data display.
 */
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className={`p-5 bg-gray-800 rounded-xl shadow-lg border-b-4 border-${color}-500 transition-transform hover:scale-[1.02] cursor-pointer`}>
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-full bg-gray-900 text-${color}-400`}>
        <Icon size={24} />
      </div>
      <span className="text-sm font-semibold text-gray-400">{title}</span>
    </div>
    <div className="mt-3">
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  </div>
);

/**
 * Sidebar Navigation Link
 */
const NavLink = ({ icon: Icon, text, isActive, onClick }) => (
  <button
    className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
    onClick={onClick}
  >
    <Icon size={20} className="mr-3" />
    <span className="font-medium">{text}</span>
  </button>
);

// --- Main Dashboard Content ---

const DashboardContent = () => (
  <div className="p-4 sm:p-6 lg:p-8 space-y-8">
    <h1 className="text-3xl font-extrabold text-white border-b border-gray-700 pb-3">
      CyberShield: Real-Time Overview
    </h1>

    {/* Stat Cards Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Active Threats"
        value="12"
        icon={Shield}
        color="red"
      />
      <StatCard
        title="Data Volume (TB)"
        value="5.4"
        icon={Database}
        color="indigo"
      />
      <StatCard
        title="System Uptime (%)"
        value="99.98"
        icon={Cpu}
        color="green"
      />
      <StatCard
        title="Incidents Resolved"
        value="452"
        icon={BarChart3}
        color="yellow"
      />
    </div>

    {/* Recent Activity and System Health */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent Activity Card */}
      <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl shadow-2xl space-y-4">
        <h2 className="text-xl font-semibold text-white border-b border-gray-700 pb-2">Recent Security Events</h2>
        <ul className="divide-y divide-gray-700">
          {[
            { time: '1 min ago', event: 'Anomaly detected in user authentication logs.', type: 'Warning' },
            { time: '5 min ago', event: 'New vulnerability scan initiated by Admin.', type: 'Info' },
            { time: '15 min ago', event: 'DDoS protection threshold breach attempt.', type: 'Critical' },
            { time: '30 min ago', event: 'Database backup successfully completed.', type: 'Success' },
          ].map((item, index) => (
            <li key={index} className="flex justify-between items-center py-3">
              <div className="flex flex-col">
                <p className="text-white font-medium">{item.event}</p>
                <p className="text-xs text-gray-500 mt-1">{item.time}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                item.type === 'Critical' ? 'bg-red-900 text-red-300' :
                item.type === 'Warning' ? 'bg-yellow-900 text-yellow-300' :
                item.type === 'Info' ? 'bg-indigo-900 text-indigo-300' :
                'bg-green-900 text-green-300'
              }`}>
                {item.type}
              </span>
            </li>
          ))}
        </ul>
        <div className="pt-3 border-t border-gray-700">
          <button className="flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-150 text-sm">
            View All Logs <ArrowRight size={16} className="ml-1" />
          </button>
        </div>
      </div>

      {/* Quick Status Summary Card */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl space-y-4">
        <h2 className="text-xl font-semibold text-white border-b border-gray-700 pb-2">System Health Status</h2>
        <div className="space-y-4">
          <HealthItem label="Network Latency" status="Good (12ms)" color="green" />
          <HealthItem label="Firewall Config" status="Up to Date" color="green" />
          <HealthItem label="Pending Updates" status="5 Critical" color="red" />
          <HealthItem label="Storage Capacity" status="85% Used" color="yellow" />
        </div>
        <div className="pt-4">
          <button className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
            Run Diagnostics
          </button>
        </div>
      </div>
    </div>
  </div>
);

const HealthItem = ({ label, status, color }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-300">{label}</span>
    <span className={`text-${color}-400 font-semibold flex items-center`}>
      <span className={`w-2 h-2 rounded-full mr-2 bg-${color}-500`}></span>
      {status}
    </span>
  </div>
);


// --- Main App Component ---

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Threats', icon: Shield },
    { name: 'Data Management', icon: Database },
    { name: 'Configuration', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-900 font-sans antialiased text-white">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Layout Container */}
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 w-64 h-full bg-gray-800 shadow-xl z-40 p-5 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Logo and Close Button */}
          <div className="flex justify-between items-center pb-6 mb-6 border-b border-gray-700">
            <h1 className="text-2xl font-black text-blue-500 flex items-center">
              <Shield size={24} className="mr-2" />
              CyberShield
            </h1>
            <button
              className="text-gray-400 hover:text-white lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                text={item.name}
                icon={item.icon}
                isActive={activeTab === item.name}
                onClick={() => {
                  setActiveTab(item.name);
                  setIsSidebarOpen(false); // Close sidebar on mobile after click
                }}
              />
            ))}
          </nav>

          {/* User Profile Footer */}
          <div className="absolute bottom-0 left-0 w-full p-5 border-t border-gray-700">
            <div className="flex items-center p-3 bg-gray-700 rounded-xl">
              <User size={24} className="text-blue-400 mr-3" />
              <div>
                <p className="text-sm font-semibold text-white">Admin User</p>
                <p className="text-xs text-gray-400">Security Officer</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 transition-all duration-300 ease-in-out">
          {/* Header/Navbar */}
          <header className="sticky top-0 z-20 bg-gray-800/90 backdrop-blur-sm shadow-md p-4 flex justify-between items-center border-b border-gray-700">
            {/* Mobile Menu Button */}
            <button
              className="text-gray-400 hover:text-white lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>

            {/* Current Page Title (Desktop/Tablet) */}
            <h2 className="hidden sm:block text-xl font-bold text-white ml-2">{activeTab}</h2>

            {/* Search, Notifications, and User */}
            <div className="flex items-center space-x-4 ml-auto">
              <input
                type="text"
                placeholder="Search resources..."
                className="hidden md:block p-2 rounded-lg bg-gray-700 text-gray-300 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="p-2 text-gray-400 hover:text-white bg-gray-700 rounded-full transition-colors">
                <Bell size={20} />
              </button>
              <div className="p-2 text-blue-400 bg-gray-700 rounded-full">
                <User size={20} />
              </div>
            </div>
          </header>

          {/* Page Content based on activeTab */}
          {/* We only render the Dashboard content for now */}
          <DashboardContent />

          {/* Simple Footer for aesthetics */}
          <footer className="p-4 text-center text-xs text-gray-500 border-t border-gray-800 mt-8">
             &copy; 2024 CyberShield Security Platform. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;