'use client'
```jsx
import React from 'react';
import { Home, User, DollarSign, TrendingUp, Activity } from 'react-feather';
import { LineChart, PieChart } from 'react-minimal-pie-chart';

export const Dashboard = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white border-b w-full p-4">
        <h2 className="font-semibold text-xl">Dashboard</h2>
      </div>
      <div className="flex-grow container mx-auto sm:px-4 pt-6 pb-8">
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/2 xl:w-1/4 px-2">
            <div className="flex items-center p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800">
              <div className="p-3 mr-4 text-orange-500 bg-orange-100 rounded-full dark:text-orange-100 dark:bg-orange-500">
                <User />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Customers
                </p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  0
                </p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 xl:w-1/4 px-2">
            <div className="flex items-center p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800">
              <div className="p-3 mr-4 text-green-500 bg-green-100 rounded-full dark:text-green-100 dark:bg-green-500">
                <DollarSign />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Revenue
                </p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  $0
                </p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 xl:w-1/4 px-2">
            <div className="flex items-center p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800">
              <div className="p-3 mr-4 text-blue-500 bg-blue-100 rounded-full dark:text-blue-100 dark:bg-blue-500">
                <TrendingUp />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Growth Rate
                </p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  0%
                </p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 xl:w-1/4 px-2">
            <div className="flex items-center p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800">
              <div className="p-3 mr-4 text-teal-500 bg-teal-100 rounded-full dark:text-teal-100 dark:bg-teal-500">
                <Activity />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Health Score
                </p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  50%
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap -mx-2 mt-6">
          <div className="w-full xl:w-1/2 px-2">
            <div className="bg-white rounded-lg shadow-xs p-4 dark:bg-gray-800">
              <LineChart data={[0, 10, 5, 22, 3, 8]} />
            </div>
          </div>
          <div className="w-full xl:w-1/2 px-2 mt-4 xl:mt-0">
            <div className="bg-white rounded-lg shadow-xs p-4 dark:bg-gray-800">
              <PieChart data={[{ title: 'One', value: 10, color: '#E38627' }, { title: 'Two', value: 15, color: '#C13C37' }, { title: 'Three', value: 20, color: '#6A2135' }]} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap -mx-2 mt-6">
          <div className="w-full px-2">
            <div className="bg-white rounded-lg shadow-xs p-4 dark:bg-gray-800">
              <h4 className="mb-4 font-semibold text-gray-600 dark:text-gray-300">
                Recent Activity
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                No recent activity
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white border-t w-full p-4">
        <div className="flex">
          <div className="w-1/4 p-2">
            <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              <Home /> Dashboard
            </button>
          </div>
          <div className="w-1/4 p-2">
            <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              <User /> Customers
            </button>
          </div>
          <div className="w-1/4 p-2">
            <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              <DollarSign /> Revenue
            </button>
          </div>
          <div className="w-1/4 p-2">
            <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              <TrendingUp /> Growth
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

This code creates a dashboard with key metrics cards, line and pie charts, a recent activity list, and navigation buttons to data management pages. It uses Tailwind CSS for styling and Lucide React icons for the icons. The charts are created using the react-minimal-pie-chart library. The data in the charts and the metrics cards are hardcoded and should be replaced with real data.