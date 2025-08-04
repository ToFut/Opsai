'use client'
```jsx
import React from 'react';
import { Home, User, PieChart, Activity } from 'react-feather';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const Dashboard = ({ data }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="relative flex items-center justify-between h-16">
            <div className="flex items-center px-2 lg:px-0">
              <div className="flex-shrink-0">
                <img className="h-8 w-8" src="/img/logo.svg" alt="Logo" />
              </div>
              <div className="hidden lg:block lg:ml-10">
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-900 hover:text-gray-700">Dashboard</a>
                  <a href="#" className="text-gray-500 hover:text-gray-700">Customers</a>
                  <a href="#" className="text-gray-500 hover:text-gray-700">Analytics</a>
                  <a href="#" className="text-gray-500 hover:text-gray-700">Settings</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-white rounded shadow">
            <div className="flex items-center">
              <div className="p-3 rounded bg-blue-100">
                <User className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-semibold">Total Customers</h4>
                <p className="text-gray-500">{data.metrics.totalCustomers}</p>
              </div>
            </div>
          </div>
          <div className="p-5 bg-white rounded shadow">
            <div className="flex items-center">
              <div className="p-3 rounded bg-green-100">
                <PieChart className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-semibold">Total Revenue</h4>
                <p className="text-gray-500">${data.metrics.totalRevenue}</p>
              </div>
            </div>
          </div>
          <div className="p-5 bg-white rounded shadow">
            <div className="flex items-center">
              <div className="p-3 rounded bg-yellow-100">
                <Home className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-semibold">Average Monthly Revenue</h4>
                <p className="text-gray-500">${data.metrics.avgMonthlyRevenue}</p>
              </div>
            </div>
          </div>
          <div className="p-5 bg-white rounded shadow">
            <div className="flex items-center">
              <div className="p-3 rounded bg-red-100">
                <Activity className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-semibold">Churn Risk</h4>
                <p className="text-gray-500">{data.metrics.churnRisk}%</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 bg-white rounded shadow">
            <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
            <LineChart width={500} height={300} data={data.revenueTrend}>
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
              <CartesianGrid stroke="#ccc" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
            </LineChart>
          </div>
          <div className="p-5 bg-white rounded shadow">
            <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
            <ul>
              {data.recentActivities.map((activity, index) => (
                <li key={index} className="mb-2">
                  <p className="text-gray-800">{activity}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
```
This code creates a comprehensive dashboard with key metrics cards, a line chart for showing important data trends, a recent activity list, and navigation to data management pages. The data is passed in as a prop to the Dashboard component. The data should be in the format specified in the problem statement.