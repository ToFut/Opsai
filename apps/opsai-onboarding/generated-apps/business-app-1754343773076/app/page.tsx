'use client'
```jsx
import React from 'react';
import { Home, User, PieChart, Activity, Database } from 'react-feather';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const Dashboard = ({ data }) => {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <div className="md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-gray-800">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 bg-gray-800 space-y-1">
                <a href="#" className="bg-gray-900 text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                  <Home className="text-gray-300 mr-3 flex-shrink-0 h-6 w-6" />
                  Dashboard
                </a>
                <a href="#" className="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                  <User className="text-gray-300 mr-3 flex-shrink-0 h-6 w-6" />
                  Customers
                </a>
                <a href="#" className="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                  <PieChart className="text-gray-300 mr-3 flex-shrink-0 h-6 w-6" />
                  Reports
                </a>
                <a href="#" className="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                  <Activity className="text-gray-300 mr-3 flex-shrink-0 h-6 w-6" />
                  Activity
                </a>
                <a href="#" className="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                  <Database className="text-gray-300 mr-3 flex-shrink-0 h-6 w-6" />
                  Database
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-600 md:hidden" aria-label="Open sidebar">
            <MenuIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <form className="w-full flex md:ml-0" action="#" method="GET">
                <label htmlFor="search_field" className="sr-only">Search</label>
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <input id="search_field" className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm" placeholder="Search" type="search" name="search" />
                </div>
              </form>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <BellIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        <main className="flex-1 relative overflow-y-auto focus:outline-none" tabIndex={0}>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="py-4">
                <div className="border-4 border-dashed border-gray-200 rounded-lg h-96"></div>
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

This is a basic layout for a dashboard page using Tailwind CSS for styling. It includes a sidebar navigation, a search bar, and a main content area. You can replace the placeholder div with your own components to display the data you have. You can also use libraries like Recharts to create charts and graphs. 

Please note that this is a basic layout and you might need to adjust it according to your needs. Also, the actual data is not used in this example as it requires server-side processing and this is beyond the scope of this task.