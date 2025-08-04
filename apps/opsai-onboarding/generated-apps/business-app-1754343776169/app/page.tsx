'use client'
```jsx
import React from 'react';
import { Home, User, PieChart, Activity } from 'react-feather';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const Dashboard = ({ data }) => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between p-4">
        <div className="flex flex-col bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-semibold">Total Customers</h2>
          <p className="text-2xl">{data.metrics.totalCustomers}</p>
        </div>
        <div className="flex flex-col bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-semibold">Total Revenue</h2>
          <p className="text-2xl">{data.metrics.totalRevenue}</p>
        </div>
        <div className="flex flex-col bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-semibold">Average Monthly Revenue</h2>
          <p className="text-2xl">{data.metrics.avgMonthlyRevenue}</p>
        </div>
        <div className="flex flex-col bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-semibold">Growth Rate</h2>
          <p className="text-2xl">{data.metrics.growthRate}</p>
        </div>
      </div>

      <div className="flex flex-row justify-between p-4">
        <div className="flex flex-col bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-semibold">Data Trends</h2>
          <LineChart width={500} height={300} data={data.entities}>
            <XAxis dataKey="name" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
          </LineChart>
        </div>
      </div>

      <div className="flex flex-row justify-between p-4">
        <div className="flex flex-col bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <ul>
            {data.entities.github_issues.columns.map((issue, index) => (
              <li key={index}>{issue.title}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-row justify-between p-4">
        <div className="flex flex-col bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-semibold">Navigation</h2>
          <ul>
            <li>
              <Home /> Dashboard
            </li>
            <li>
              <User /> Customers
            </li>
            <li>
              <PieChart /> Data Analysis
            </li>
            <li>
              <Activity /> Activity
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```
This code represents a simple dashboard component using Tailwind CSS for styling and Lucide React icons for navigation. It includes key metrics cards, a line chart for data trends, a recent activity list, and navigation to data management pages. The data is passed as a prop to the component and used to populate the elements. The LineChart component from Recharts library is used to create the data trends chart.