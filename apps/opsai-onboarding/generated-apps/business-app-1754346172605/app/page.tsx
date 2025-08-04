'use client'
```jsx
import React from 'react';
import { Home, User, DollarSign, TrendingUp, Activity } from 'react-feather';
import { LineChart, PieChart } from 'react-minimal-pie-chart';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div>
              <div className="flex items-center space-x-5">
                <Home className="w-6 h-6 text-gray-400" />
                <h1 className="text-2xl font-bold">Dashboard</h1>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="flex items-center p-4 bg-blue-100 rounded-lg">
                  <User className="w-8 h-8 text-blue-500" />
                  <div className="ml-4 text-sm">
                    <h4 className="font-semibold">Total Customers</h4>
                    <p>0</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-green-100 rounded-lg">
                  <DollarSign className="w-8 h-8 text-green-500" />
                  <div className="ml-4 text-sm">
                    <h4 className="font-semibold">Total Revenue</h4>
                    <p>$0</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                  <div className="ml-4 text-sm">
                    <h4 className="font-semibold">Growth Rate</h4>
                    <p>0%</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-red-100 rounded-lg">
                  <Activity className="w-8 h-8 text-red-500" />
                  <div className="ml-4 text-sm">
                    <h4 className="font-semibold">Churn Risk</h4>
                    <p>70%</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <LineChart data={[{ value: 0 }]} />
              </div>
              <div className="mt-8">
                <PieChart data={[{ value: 0 }]} />
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <div className="mt-4">
                  <p>No recent activity</p>
                </div>
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

This code creates a basic dashboard with key metrics cards, a line chart, a pie chart, and a recent activity section. The data is currently hardcoded as the provided data is insufficient. You would need to replace the hardcoded data with actual data from your application. The `LineChart` and `PieChart` components are placeholders and would need to be replaced with actual chart components.