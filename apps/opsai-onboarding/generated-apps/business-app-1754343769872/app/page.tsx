'use client'
```jsx
import React from 'react';
import { Home, User, PieChart, Activity } from 'react-feather';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

const Dashboard = ({ data }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex flex-row bg-white shadow rounded-lg p-4 m-4">
        <div className="flex flex-1 items-center justify-center">
          <div className="p-4">
            <Home className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex-1 text-right md:text-center">
            <h5 className="font-bold uppercase text-gray-500">Total Customers</h5>
            <h3 className="font-bold text-3xl">{data.metrics.totalCustomers}</h3>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="p-4">
            <User className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex-1 text-right md:text-center">
            <h5 className="font-bold uppercase text-gray-500">Health Score</h5>
            <h3 className="font-bold text-3xl">{data.metrics.healthScore}%</h3>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="p-4">
            <PieChart className="h-6 w-6 text-green-500" />
          </div>
          <div className="flex-1 text-right md:text-center">
            <h5 className="font-bold uppercase text-gray-500">Churn Risk</h5>
            <h3 className="font-bold text-3xl">{data.metrics.churnRisk}%</h3>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-wrap">
        <div className="w-full lg:w-1/2 p-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4">
              <h5 className="font-bold uppercase text-gray-500">Revenue Trend</h5>
              <LineChart width={400} height={200} data={data.revenueData}>
                <Line type="monotone" dataKey="uv" stroke="#8884d8" />
                <CartesianGrid stroke="#ccc" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
              </LineChart>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 p-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4">
              <h5 className="font-bold uppercase text-gray-500">Recent Activity</h5>
              <ul>
                {data.recentActivity.map((activity, index) => (
                  <li key={index} className="border-b border-gray-200">
                    <div className="flex items-center py-2">
                      <Activity className="h-6 w-6 text-gray-500" />
                      <span className="ml-2 text-sm">{activity}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

Please note that this code assumes you have a `data` prop that contains the necessary data for the dashboard. The `data` prop should include `metrics`, `revenueData`, and `recentActivity` properties. The `metrics` property should be an object that includes `totalCustomers`, `healthScore`, and `churnRisk`. The `revenueData` should be an array of objects for the line chart, and `recentActivity` should be an array of strings for the recent activity list.