'use client'
```jsx
import React from 'react';
import { IconHome, IconUsers, IconDollarSign, IconTrendingUp, IconActivity } from 'react-icons-kit';
import { LineChart, PieChart } from 'react-chartjs-2';

const Dashboard = () => {
  // Mock data for charts
  const lineChartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        label: 'Health Score',
        data: [65, 59, 80, 81, 56, 55, 40],
        fill: false,
        backgroundColor: 'rgb(75, 192, 192)',
        borderColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  const pieChartData = {
    labels: ['Google', 'Github'],
    datasets: [
      {
        label: 'Providers',
        data: [300, 50],
        backgroundColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)'],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <span className="text-2xl font-semibold text-gray-800">Dashboard</span>
        </div>
      </div>
      <div className="flex flex-grow p-6">
        <div className="flex flex-col w-full space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center p-4 bg-white rounded-lg shadow-xs">
              <div className="p-3 mr-4 text-orange-500 bg-orange-100 rounded-full">
                <IconHome />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">
                  Total Customers
                </p>
                <p className="text-lg font-semibold text-gray-700">
                  0
                </p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-white rounded-lg shadow-xs">
              <div className="p-3 mr-4 text-green-500 bg-green-100 rounded-full">
                <IconUsers />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-lg font-semibold text-gray-700">
                  $0
                </p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-white rounded-lg shadow-xs">
              <div className="p-3 mr-4 text-blue-500 bg-blue-100 rounded-full">
                <IconDollarSign />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">
                  Avg Monthly Revenue
                </p>
                <p className="text-lg font-semibold text-gray-700">
                  $0
                </p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-white rounded-lg shadow-xs">
              <div className="p-3 mr-4 text-teal-500 bg-teal-100 rounded-full">
                <IconTrendingUp />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">
                  Growth Rate
                </p>
                <p className="text-lg font-semibold text-gray-700">
                  0%
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="p-4 bg-white rounded-lg shadow-xs">
              <h4 className="mb-4 text-lg font-semibold text-gray-800">
                Health Score Over Time
              </h4>
              <LineChart data={lineChartData} />
            </div>
            <div className="p-4 bg-white rounded-lg shadow-xs">
              <h4 className="mb-4 text-lg font-semibold text-gray-800">
                Providers Breakdown
              </h4>
              <PieChart data={pieChartData} />
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-xs">
            <h4 className="mb-4 text-lg font-semibold text-gray-800">
              Recent Activity
            </h4>
            <ul>
              <li className="flex items-center">
                <IconActivity />
                <span className="ml-2">User signed up</span>
              </li>
              <li className="flex items-center mt-2">
                <IconActivity />
                <span className="ml-2">User logged in</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

This is a simple dashboard component using Tailwind CSS for styling and Lucide React for icons. It includes key metrics cards, line and pie charts for data trends, and a recent activity list. The chart components are from the react-chartjs-2 library. The data used in the charts is mock data and should be replaced with real data.