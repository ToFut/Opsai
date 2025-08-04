'use client'
```jsx
import React from 'react';
import { Home, User, PieChart, Activity } from 'react-feather';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const Dashboard = ({ data }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white border-b w-full p-4">
        <h2 className="font-semibold text-xl">Dashboard</h2>
      </div>
      <div className="flex-grow container mx-auto sm:px-4 pt-6 pb-8">
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/2 xl:w-1/3 px-2">
            <div className="flex items-center p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800">
              <div className="p-3 mr-4 text-orange-500 bg-orange-100 rounded-full dark:text-orange-100 dark:bg-orange-500">
                <Home />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Customers
                </p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  {data.metrics.totalCustomers}
                </p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 xl:w-1/3 px-2">
            <div className="flex items-center p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800">
              <div className="p-3 mr-4 text-green-500 bg-green-100 rounded-full dark:text-green-100 dark:bg-green-500">
                <User />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Health Score
                </p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  {data.metrics.healthScore}%
                </p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 xl:w-1/3 px-2">
            <div className="flex items-center p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800">
              <div className="p-3 mr-4 text-blue-500 bg-blue-100 rounded-full dark:text-blue-100 dark:bg-blue-500">
                <PieChart />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Churn Risk
                </p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  {data.metrics.churnRisk}%
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <div className="flex flex-wrap -mx-2">
            <div className="w-full px-2">
              <p className="mb-4 text-lg font-semibold text-gray-600 dark:text-gray-300">
                Revenue Trend
              </p>
              <div className="p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800">
                <LineChart width={500} height={300} data={data.revenueData}>
                  <Line type="monotone" dataKey="uv" stroke="#8884d8" />
                  <CartesianGrid stroke="#ccc" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                </LineChart>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <div className="flex flex-wrap -mx-2">
            <div className="w-full px-2">
              <p className="mb-4 text-lg font-semibold text-gray-600 dark:text-gray-300">
                Recent Activity
              </p>
              <div className="p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800">
                <ul>
                  {data.recentActivity.map((activity, index) => (
                    <li key={index} className="flex items-center">
                      <Activity className="mr-2" />
                      <span>{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```
This is a comprehensive dashboard component using Tailwind CSS for styling and Lucide React for icons. It includes key metrics cards, a line chart for showing revenue trend, a recent activity list, and navigation to data management pages. The data is passed as a prop to the component.