'use client'
Here is a simple example of how you could structure your dashboard component using Tailwind CSS and Lucide React icons. Please note that you'll need to implement the data fetching and handling logic yourself.

```jsx
import React from 'react';
import { Home, User, PieChart, Activity } from 'react-feather';

const Dashboard = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <Home className="w-6 h-6 text-gray-500" />
          <span className="ml-4 text-lg font-semibold text-gray-700">Dashboard</span>
        </div>
        <div className="flex items-center">
          <User className="w-6 h-6 text-gray-500" />
          <span className="ml-2 text-sm text-gray-500">John Doe</span>
        </div>
      </div>
      <div className="flex flex-1 p-6 overflow-y-auto">
        <div className="w-64 pr-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-700">Navigation</h2>
          <nav>
            <a className="flex items-center px-4 py-2 mt-2 text-gray-700 bg-gray-200 rounded" href="#">
              <PieChart className="w-4 h-4 mr-2" />
              Overview
            </a>
            <a className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-200 rounded" href="#">
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </a>
            {/* Add more navigation links as needed */}
          </nav>
        </div>
        <div className="flex-1">
          <h2 className="mb-4 text-xl font-semibold text-gray-700">Key Metrics</h2>
          <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
            {/* Replace the numbers with actual data */}
            <Card title="Total Customers" value={100} icon={<User className="w-12 h-12 text-white" />} color="blue" />
            <Card title="Total Revenue" value="$20000" icon={<DollarSign className="w-12 h-12 text-white" />} color="green" />
            {/* Add more cards as needed */}
          </div>
          <h2 className="mb-4 text-xl font-semibold text-gray-700">Recent Activity</h2>
          {/* Implement your recent activity list here */}
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, value, icon, color }) => {
  return (
    <div className={`flex items-center p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800`}>
      <div className={`p-3 mr-4 text-${color}-500 bg-${color}-100 rounded-full dark:text-${color}-100 dark:bg-${color}-500`}>
        {icon}
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          {value}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
```

This code creates a simple dashboard with a sidebar for navigation, a header with the user's name, and a main content area for key metrics and recent activity. The `Card` component is used to display key metrics. You would need to replace the hardcoded values with actual data from your application.