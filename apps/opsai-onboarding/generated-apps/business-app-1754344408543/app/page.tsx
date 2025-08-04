'use client'
```jsx
import React from 'react';
import { IconHome, IconUsers, IconDollarSign, IconTrendingUp } from '@iconscout/react-unicons';
import { LineChart, BarChart } from 'react-chartkick';
import 'chart.js';

const Dashboard = ({ data }) => {
  const { metrics, insights } = data;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="grid grid-cols-4 gap-4 p-4">
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <IconHome size={24} />
            <div className="ml-4 text-lg font-bold">Total Customers</div>
          </div>
          <div className="mt-2 text-3xl font-bold">{metrics.totalCustomers}</div>
        </div>
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <IconUsers size={24} />
            <div className="ml-4 text-lg font-bold">Churn Risk</div>
          </div>
          <div className="mt-2 text-3xl font-bold">{metrics.churnRisk}%</div>
        </div>
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <IconDollarSign size={24} />
            <div className="ml-4 text-lg font-bold">Total Revenue</div>
          </div>
          <div className="mt-2 text-3xl font-bold">${metrics.totalRevenue}</div>
        </div>
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <IconTrendingUp size={24} />
            <div className="ml-4 text-lg font-bold">Growth Rate</div>
          </div>
          <div className="mt-2 text-3xl font-bold">{metrics.growthRate}%</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <LineChart data={insights.business_performance_insights} />
        </div>
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <BarChart data={insights.workflow_optimization_recommendations} />
        </div>
      </div>
      <div className="p-4 bg-white rounded-lg shadow mt-4">
        <h2 className="text-lg font-bold mb-2">Recent Activity</h2>
        <ul>
          {data.recentActivity.map((activity, index) => (
            <li key={index}>{activity}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
```

Please note that this is a basic implementation and you might need to adjust it according to your needs. Also, the data used in the charts is just placeholder data. You would need to replace it with your actual data.