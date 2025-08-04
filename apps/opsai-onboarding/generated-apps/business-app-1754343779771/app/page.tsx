'use client'
```jsx
import React from 'react';
import { Home, User, BarChart2, List, PieChart } from 'react-feather';
import { LineChart, Pie } from 'react-chartjs-2';

const Dashboard = () => {
  const data = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'My First dataset',
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(75,192,192,1)',
        hoverBorderColor: 'rgba(220,220,220,1)',
        data: [65, 59, 80, 81, 56, 55, 40]
      }
    ]
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <nav className="w-64 px-2 py-4 overflow-y-auto bg-white">
          <a href="#" className="flex items-center px-2 py-2 text-gray-900 rounded hover:bg-gray-100">
            <Home className="w-5 h-5 mr-2" /> Dashboard
          </a>
          <a href="#" className="flex items-center px-2 py-2 mt-1 text-gray-900 rounded hover:bg-gray-100">
            <User className="w-5 h-5 mr-2" /> Customers
          </a>
          <a href="#" className="flex items-center px-2 py-2 mt-1 text-gray-900 rounded hover:bg-gray-100">
            <BarChart2 className="w-5 h-5 mr-2" /> Reports
          </a>
          <a href="#" className="flex items-center px-2 py-2 mt-1 text-gray-900 rounded hover:bg-gray-100">
            <List className="w-5 h-5 mr-2" /> Tasks
          </a>
        </nav>
        <main className="p-4 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-white rounded shadow">
              <h5 className="text-sm font-bold text-gray-500">Total Customers</h5>
              <p className="text-lg font-semibold">0</p>
            </div>
            <div className="p-4 bg-white rounded shadow">
              <h5 className="text-sm font-bold text-gray-500">Total Revenue</h5>
              <p className="text-lg font-semibold">$0</p>
            </div>
            <div className="p-4 bg-white rounded shadow">
              <h5 className="text-sm font-bold text-gray-500">Average Monthly Revenue</h5>
              <p className="text-lg font-semibold">$0</p>
            </div>
            <div className="p-4 bg-white rounded shadow">
              <h5 className="text-sm font-bold text-gray-500">Growth Rate</h5>
              <p className="text-lg font-semibold">0%</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2">
            <div className="p-4 bg-white rounded shadow">
              <h5 className="text-sm font-bold text-gray-500">Revenue Trend</h5>
              <LineChart data={data} />
            </div>
            <div className="p-4 bg-white rounded shadow">
              <h5 className="text-sm font-bold text-gray-500">Customer Growth</h5>
              <Pie data={data} />
            </div>
          </div>
          <div className="mt-8">
            <h5 className="text-sm font-bold text-gray-500">Recent Activity</h5>
            <div className="mt-4 bg-white rounded shadow">
              <div className="p-4 border-b">
                <h6 className="text-sm font-semibold text-gray-900">Activity 1</h6>
                <p className="text-sm text-gray-500">Details about the activity...</p>
              </div>
              <div className="p-4 border-b">
                <h6 className="text-sm font-semibold text-gray-900">Activity 2</h6>
                <p className="text-sm text-gray-500">Details about the activity...</p>
              </div>
              <div className="p-4">
                <h6 className="text-sm font-semibold text-gray-900">Activity 3</h6>
                <p className="text-sm text-gray-500">Details about the activity...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
```

This code creates a comprehensive dashboard with key metrics cards, charts showing important data trends, a recent activity list, and navigation to data management pages. It uses Tailwind CSS for styling and Lucide React for icons. The charts are created using Chart.js and the react-chartjs-2 wrapper. Please replace the dummy data with your actual data.