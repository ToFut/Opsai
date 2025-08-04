'use client'
```jsx
import React from 'react';
import { Home, Users, BarChart2, List, Settings } from 'react-feather';
import { Line } from 'react-chartjs-2';

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-200">
      <div className="w-64 bg-white rounded-r-3xl overflow-hidden">
        <div className="flex items-center justify-center mt-8">
          <h1 className="text-gray-700 text-3xl">Dashboard</h1>
        </div>
        <nav className="mt-10">
          <a className="flex items-center mt-4 py-2 px-6 bg-gray-200 text-gray-700 border-r-4 border-gray-700" href="#">
            <Home className="h-6 w-6" />
            <span className="mx-3">Home</span>
          </a>
          <a className="flex items-center mt-4 py-2 px-6 text-gray-700 hover:bg-gray-200" href="#">
            <Users className="h-6 w-6" />
            <span className="mx-3">Users</span>
          </a>
          <a className="flex items-center mt-4 py-2 px-6 text-gray-700 hover:bg-gray-200" href="#">
            <BarChart2 className="h-6 w-6" />
            <span className="mx-3">Analytics</span>
          </a>
          <a className="flex items-center mt-4 py-2 px-6 text-gray-700 hover:bg-gray-200" href="#">
            <List className="h-6 w-6" />
            <span className="mx-3">Tasks</span>
          </a>
          <a className="flex items-center mt-4 py-2 px-6 text-gray-700 hover:bg-gray-200" href="#">
            <Settings className="h-6 w-6" />
            <span className="mx-3">Settings</span>
          </a>
        </nav>
      </div>
      <div className="flex-1 p-10 text-2xl font-bold">
        <h3 className="text-gray-700 font-semibold">Hello, User!</h3>
        <div className="mt-5 text-gray-600">
          <Line data={{
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
              label: 'Revenue',
              data: [0, 10, 5, 15, 10, 20, 15],
              fill: false,
              backgroundColor: 'blue',
              borderColor: 'blue',
            }],
          }} />
        </div>
        <div className="flex mt-10">
          <div className="w-1/3 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-gray-800 text-lg font-semibold">Total Customers</h2>
            <p className="mt-2 text-gray-600">0</p>
          </div>
          <div className="w-1/3 p-6 bg-white rounded-lg shadow-md mx-2">
            <h2 className="text-gray-800 text-lg font-semibold">Total Revenue</h2>
            <p className="mt-2 text-gray-600">$0</p>
          </div>
          <div className="w-1/3 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-gray-800 text-lg font-semibold">Average Monthly Revenue</h2>
            <p className="mt-2 text-gray-600">$0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

This code generates a simple dashboard with a navigation bar on the left side and a main content area on the right. The main content area includes a welcome message, a line chart for displaying data trends, and three key metrics cards for total customers, total revenue, and average monthly revenue. The navigation bar includes links to home, users, analytics, tasks, and settings pages. The icons for these links are provided by Lucide React. The styling is done using Tailwind CSS.