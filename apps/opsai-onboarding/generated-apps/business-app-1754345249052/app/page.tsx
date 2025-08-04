'use client'
```jsx
import React from 'react';
import { Home, User, DollarSign, TrendingUp, Activity } from 'react-feather';
import { LineChart, BarChart } from 'react-chartjs-2';

const Dashboard = ({ data }) => {
  const { metrics, insights } = data;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex flex-row justify-between p-4 bg-white shadow">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex flex-row space-x-4">
          <Home className="w-5 h-5" />
          <User className="w-5 h-5" />
          <DollarSign className="w-5 h-5" />
          <TrendingUp className="w-5 h-5" />
          <Activity className="w-5 h-5" />
        </div>
      </div>
      <div className="flex flex-row p-4 space-x-4">
        <div className="flex flex-col w-1/4 p-4 bg-white shadow rounded">
          <h2 className="text-lg font-semibold">Key Metrics</h2>
          <p>Total Customers: {metrics.totalCustomers}</p>
          <p>Total Revenue: {metrics.totalRevenue}</p>
          <p>Avg Monthly Revenue: {metrics.avgMonthlyRevenue}</p>
          <p>Growth Rate: {metrics.growthRate}</p>
        </div>
        <div className="flex flex-col w-3/4 p-4 bg-white shadow rounded">
          <h2 className="text-lg font-semibold">Data Trends</h2>
          <LineChart data={metrics} />
          <BarChart data={insights} />
        </div>
      </div>
      <div className="flex flex-col p-4 bg-white shadow rounded">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        {/* Map through recent activity data here */}
      </div>
      <div className="flex flex-row justify-end p-4 bg-white shadow">
        <button className="px-4 py-2 text-white bg-blue-500 rounded">Manage Data</button>
      </div>
    </div>
  );
};

export default Dashboard;
```

Please note that this is a basic implementation and you may need to adjust it according to your needs. The data for the charts (LineChart and BarChart) should be prepared according to the Chart.js documentation. Also, you would need to map through your recent activity data and render it in the "Recent Activity" section.