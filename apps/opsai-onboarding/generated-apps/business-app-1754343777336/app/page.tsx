'use client'
```jsx
import React from 'react';
import { Home, User, DollarSign, TrendingUp, AlertCircle } from 'react-feather';
import { LineChart, BarChart } from 'react-chartjs-2';

const Dashboard = ({ data }) => {
  const metrics = data.metrics;

  return (
    <div className="flex flex-col mx-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="flex items-center">
            <User className="text-green-500" />
            <p className="ml-2 text-lg font-semibold">Total Customers</p>
          </div>
          <p className="text-2xl font-bold">{metrics.totalCustomers}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="flex items-center">
            <DollarSign className="text-blue-500" />
            <p className="ml-2 text-lg font-semibold">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold">${metrics.totalRevenue}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="flex items-center">
            <TrendingUp className="text-purple-500" />
            <p className="ml-2 text-lg font-semibold">Growth Rate</p>
          </div>
          <p className="text-2xl font-bold">{metrics.growthRate}%</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="flex items-center">
            <AlertCircle className="text-red-500" />
            <p className="ml-2 text-lg font-semibold">Churn Risk</p>
          </div>
          <p className="text-2xl font-bold">{metrics.churnRisk}%</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <LineChart data={data.lineChartData} />
        </div>
        <div className="p-4 bg-white rounded shadow">
          <BarChart data={data.barChartData} />
        </div>
      </div>

      <div className="mt-8 p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <ul>
          {data.recentActivity.map((activity, index) => (
            <li key={index}>{activity}</li>
          ))}
        </ul>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow flex items-center">
          <Home className="text-blue-500" />
          <a href="/manage-data" className="ml-2 text-lg font-semibold">Manage Data</a>
        </div>
        <div className="p-4 bg-white rounded shadow flex items-center">
          <Home className="text-green-500" />
          <a href="/manage-users" className="ml-2 text-lg font-semibold">Manage Users</a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

Please note that this code assumes that you are passing the necessary data as a prop to the Dashboard component. The data prop should include metrics, lineChartData, barChartData, and recentActivity. Also, the hrefs in the navigation links should be replaced with your actual routes.