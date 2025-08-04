'use client'
```jsx
import React from 'react';
import { Home, User, PieChart, Activity } from 'react-feather';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import 'tailwindcss/tailwind.css';

const Dashboard = ({ data, metrics }) => {
  return (
    <div className="flex h-screen bg-gray-200">
      <div className="w-64 bg-white rounded-r-3xl overflow-hidden">
        <div className="flex items-center justify-center mt-8">
          <h1 className="text-gray-700 text-3xl">Dashboard</h1>
        </div>
        <nav className="mt-10">
          <a className="flex items-center mt-4 py-2 px-6 bg-gray-200 bg-opacity-25 text-gray-700" href="#">
            <Home className="h-6 w-6" />
            <span className="mx-3">Home</span>
          </a>
          <a className="flex items-center mt-4 py-2 px-6 text-gray-500 hover:bg-gray-200 hover:bg-opacity-25 hover:text-gray-700" href="#">
            <User className="h-6 w-6" />
            <span className="mx-3">Users</span>
          </a>
          <a className="flex items-center mt-4 py-2 px-6 text-gray-500 hover:bg-gray-200 hover:bg-opacity-25 hover:text-gray-700" href="#">
            <PieChart className="h-6 w-6" />
            <span className="mx-3">Analytics</span>
          </a>
          <a className="flex items-center mt-4 py-2 px-6 text-gray-500 hover:bg-gray-200 hover:bg-opacity-25 hover:text-gray-700" href="#">
            <Activity className="h-6 w-6" />
            <span className="mx-3">Activity</span>
          </a>
        </nav>
      </div>
      <div className="flex-1 p-10 text-2xl font-bold">
        <h3 className="text-gray-700 font-semibold">Hello, Welcome back!</h3>
        <div className="mt-5 text-gray-600">
          <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center p-4 bg-white rounded-lg shadow-xs">
              <div className="p-3 mr-4 text-orange-500 bg-orange-100 rounded-full">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 7H7v6h6V7z"></path>
                  <path fill-rule="evenodd" d="M2 2a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V2zm2 0v12h12V2H4z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Customers
                </p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  {metrics.totalCustomers}
                </p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-white rounded-lg shadow-xs">
              <div className="p-3 mr-4 text-green-500 bg-green-100 rounded-full">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                  <path fill-rule="evenodd" d="M7 2a5 5 0 0110 0v6a5 5 0 01-10 0V2zm10 0a3 3 0 00-6 0v6a3 3 0 006 0V2zM3 8a7 7 0 0114 0v1H3V8zm14 1a5 5 0 00-5 5H8a5 5 0 0010 0v-1H3v1a7 7 0 0014 0V9z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Revenue
                </p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  ${metrics.totalRevenue}
                </p>
              </div>
            </div>
          </div>
          <LineChart width={730} height={250} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="uv" stroke="#8884d8" />
          </LineChart>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```
This code creates a dashboard with a navigation sidebar and two key metrics cards for Total Customers and Total Revenue. It also includes a line chart for data trends visualization. The navigation links are placeholders and should be replaced with actual routes. The LineChart component uses the recharts library for data visualization. The data prop for the LineChart component should be an array of objects where each object represents a point on the chart.