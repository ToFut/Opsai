'use client'
```jsx
import React from 'react';
import { Home, User, PieChart, Activity } from 'react-feather';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const Dashboard = () => {
  // Sample data for LineChart
  const data = [
    { name: 'Jan', uv: 4000, pv: 2400, amt: 2400 },
    { name: 'Feb', uv: 3000, pv: 1398, amt: 2210 },
    { name: 'Mar', uv: 2000, pv: 9800, amt: 2290 },
    // Add more data as needed
  ];

  return (
    <div className="p-4">
      <div className="flex flex-wrap mb-4">
        {/* Key Metrics Cards */}
        <div className="w-full md:w-1/4 p-2">
          <div className="bg-white rounded shadow p-4">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500 text-white rounded mr-2">
                <User />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-lg font-bold">0</p>
              </div>
            </div>
          </div>
        </div>
        {/* Add more cards as needed */}
      </div>

      {/* Charts */}
      <div className="w-full bg-white rounded shadow p-4 mb-4">
        <LineChart width={600} height={300} data={data}>
          <Line type="monotone" dataKey="uv" stroke="#8884d8" />
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
        </LineChart>
      </div>

      {/* Recent Activity */}
      <div className="w-full bg-white rounded shadow p-4">
        <h2 className="text-xl font-bold mb-2">Recent Activity</h2>
        {/* List of activities */}
      </div>

      {/* Navigation */}
      <div className="w-full bg-white rounded shadow p-4 mt-4">
        <h2 className="text-xl font-bold mb-2">Manage Your Data</h2>
        <div className="flex space-x-4">
          <button className="flex items-center space-x-2">
            <Home />
            <span>Home</span>
          </button>
          <button className="flex items-center space-x-2">
            <PieChart />
            <span>Analytics</span>
          </button>
          <button className="flex items-center space-x-2">
            <Activity />
            <span>Activity</span>
          </button>
          {/* Add more navigation buttons as needed */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

This code generates a dashboard component using Tailwind CSS for styling and Lucide React for icons. It includes key metrics cards, a line chart for data trends, a placeholder for recent activity, and navigation buttons to data management pages. The chart uses Recharts, a composable charting library built on React components. Please replace the sample data and static values with your actual data.