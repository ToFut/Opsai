'use client'
```jsx
import React from 'react';
import { Home, User, PieChart, Activity } from 'react-feather';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

// Sample data for LineChart
const data = [
  { name: 'Jan', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Feb', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Mar', uv: 2000, pv: 9800, amt: 2290 },
  // Add more data as per your requirements
];

export default function Dashboard() {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white border-b w-full p-4">
        <h2 className="font-semibold text-xl">Dashboard</h2>
      </div>
      <div className="w-full flex flex-grow overflow-auto">
        <div className="w-64 bg-white border-r">
          <nav className="mt-8">
            <div className="px-6">
              <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Menu</h2>
              <ul className="mt-3 space-y-2">
                <li>
                  <a href="#" className="flex items-center space-x-3 text-gray-700 px-2 py-1 rounded-md font-medium hover:bg-gray-200">
                    <Home className="stroke-current text-gray-500 h-5 w-5" />
                    <span>Dashboard</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-3 text-gray-700 px-2 py-1 rounded-md font-medium hover:bg-gray-200">
                    <User className="stroke-current text-gray-500 h-5 w-5" />
                    <span>Users</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-3 text-gray-700 px-2 py-1 rounded-md font-medium hover:bg-gray-200">
                    <PieChart className="stroke-current text-gray-500 h-5 w-5" />
                    <span>Analytics</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-3 text-gray-700 px-2 py-1 rounded-md font-medium hover:bg-gray-200">
                    <Activity className="stroke-current text-gray-500 h-5 w-5" />
                    <span>Activity</span>
                  </a>
                </li>
                {/* Add more navigation items as per your requirements */}
              </ul>
            </div>
          </nav>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1 bg-white shadow rounded-lg p-4">
              <h3 className="font-semibold text-lg">Metric 1</h3>
              <p>Value</p>
            </div>
            <div className="flex-1 bg-white shadow rounded-lg p-4">
              <h3 className="font-semibold text-lg">Metric 2</h3>
              <p>Value</p>
            </div>
            <div className="flex-1 bg-white shadow rounded-lg p-4">
              <h3 className="font-semibold text-lg">Metric 3</h3>
              <p>Value</p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="font-semibold text-lg">Trends</h3>
            <LineChart width={500} height={300} data={data}>
              <Line type="monotone" dataKey="uv" stroke="#8884d8" />
              <CartesianGrid stroke="#ccc" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
            </LineChart>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="font-semibold text-lg">Recent Activity</h3>
            <ul>
              <li>Activity 1</li>
              <li>Activity 2</li>
              <li>Activity 3</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
```

This code creates a simple dashboard using Tailwind CSS for styling and Lucide React for icons. The dashboard includes a navigation menu, key metrics cards, a line chart for data trends, and a recent activity list. The Recharts library is used to create the line chart. Replace the placeholders with your actual data and logic.