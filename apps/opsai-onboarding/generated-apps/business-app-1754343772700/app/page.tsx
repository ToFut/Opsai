'use client'
```jsx
import React from 'react';
import { Home, User, Activity, BarChart2, Settings } from 'react-feather';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

// Tailwind CSS styles
const cardStyle = "bg-white rounded-lg shadow-md p-6 my-4";
const titleStyle = "text-xl font-semibold mb-2";
const metricStyle = "text-2xl font-bold";
const chartStyle = "bg-white rounded-lg shadow-md p-6 my-4 h-64";

// Dashboard Component
const Dashboard = ({ data }) => {
  const { metrics, insights } = data;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Key Metrics Cards */}
        <div className={cardStyle}>
          <h2 className={titleStyle}>Total Customers</h2>
          <p className={metricStyle}>{metrics.totalCustomers}</p>
        </div>
        <div className={cardStyle}>
          <h2 className={titleStyle}>Total Revenue</h2>
          <p className={metricStyle}>{metrics.totalRevenue}</p>
        </div>
        <div className={cardStyle}>
          <h2 className={titleStyle}>Average Monthly Revenue</h2>
          <p className={metricStyle}>{metrics.avgMonthlyRevenue}</p>
        </div>
        <div className={cardStyle}>
          <h2 className={titleStyle}>Growth Rate</h2>
          <p className={metricStyle}>{metrics.growthRate}</p>
        </div>
      </div>

      {/* Charts */}
      <div className={chartStyle}>
        <LineChart width={600} height={300} data={insights}>
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
        </LineChart>
      </div>

      {/* Recent Activity */}
      <div className={cardStyle}>
        <h2 className={titleStyle}>Recent Activity</h2>
        <ul>
          {insights.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex space-x-4">
        <button className="p-2 rounded bg-blue-500 text-white">
          <Home /> Dashboard
        </button>
        <button className="p-2 rounded bg-blue-500 text-white">
          <User /> Users
        </button>
        <button className="p-2 rounded bg-blue-500 text-white">
          <Activity /> Activity
        </button>
        <button className="p-2 rounded bg-blue-500 text-white">
          <BarChart2 /> Reports
        </button>
        <button className="p-2 rounded bg-blue-500 text-white">
          <Settings /> Settings
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
```

Please note that this is a simplified version of a dashboard and you might need to adjust it according to your needs. Also, you need to install `recharts` and `react-feather` for this code to work.