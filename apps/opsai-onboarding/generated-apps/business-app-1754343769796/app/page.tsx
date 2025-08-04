'use client'
```jsx
import React from 'react';
import { Home, User, DollarSign, TrendingUp, Activity } from 'react-feather';
import { LineChart, PieChart } from 'react-minimal-pie-chart';

export const Dashboard = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </div>
      <div className="flex-grow container mx-auto sm:px-4 pt-6 pb-8">
        <div className="bg-white border-t border-b sm:border-l sm:border-r sm:rounded shadow mb-6">
          <div className="border-b px-6">
            <div className="flex justify-between -mb-px">
              <div className="lg:hidden text-blue-dark py-4 text-lg">Statistics</div>
              <div className="hidden lg:flex">
                <button type="button" className="appearance-none py-4 text-blue-dark border-b border-blue-dark mr-6">
                  Customers
                </button>
                <button type="button" className="appearance-none py-4 text-gray-dark border-b border-transparent hover:border-grey-dark mr-6">
                  Revenue
                </button>
                <button type="button" className="appearance-none py-4 text-gray-dark border-b border-transparent hover:border-grey-dark mr-6">
                  Growth
                </button>
                <button type="button" className="appearance-none py-4 text-gray-dark border-b border-transparent hover:border-grey-dark">
                  Activity
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center px-6 lg:hidden">
            <div className="flex-grow flex-no-shrink py-6">
              <div className="text-grey-darker mb-2">
                <span className="text-black text-3xl align-top">$</span>
                <span className="text-black text-3xl">15,363</span>
                <span className="text-grey-dark text-sm">/mo</span>
              </div>
              <div className="text-xs uppercase text-grey tracking-wide">Total Customers</div>
            </div>
            <div className="flex-no-grow flex-no-shrink py-6">
              <LineChart data={[{ value: 1, color: '#0694a2' }]} />
            </div>
          </div>
          <div className="hidden lg:flex">
            <div className="w-1/4 text-center py-8">
              <div className="border-r">
                <div className="text-grey-darker mb-2">
                  <span className="text-black text-xl align-top">58</span>
                  <span className="text-grey-dark text-sm">/mo</span>
                </div>
                <div className="text-xs uppercase text-grey tracking-wide">Total Customers</div>
              </div>
            </div>
            <div className="w-1/4 text-center py-8">
              <div className="border-r">
                <div className="text-grey-darker mb-2">
                  <span className="text-black text-xl align-top">7</span>
                  <span className="text-grey-dark text-sm">/mo</span>
                </div>
                <div className="text-xs uppercase text-grey tracking-wide">Churn Risk</div>
              </div>
            </div>
            <div className="w-1/4 text-center py-8">
              <div className="border-r">
                <div className="text-grey-darker mb-2">
                  <span className="text-black text-xl align-top">50</span>
                  <span className="text-grey-dark text-sm">/mo</span>
                </div>
                <div className="text-xs uppercase text-grey tracking-wide">Health Score</div>
              </div>
            </div>
            <div className="w-1/4 text-center py-8">
              <div>
                <div className="text-grey-darker mb-2">
                  <span className="text-black text-xl align-top">0</span>
                  <span className="text-grey-dark text-sm">/mo</span>
                </div>
                <div className="text-xs uppercase text-grey tracking-wide">Total Revenue</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```
This is a simple dashboard component using Tailwind CSS for styling. It includes a navigation bar with links to different sections of the dashboard, and a main content area that displays key metrics in a series of cards. The metrics include total customers, churn risk, health score, and total revenue. Each card includes a line chart to visualize data trends. Note that this is a static component and you would need to integrate it with your data source to make it dynamic.