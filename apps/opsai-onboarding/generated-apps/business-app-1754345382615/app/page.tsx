'use client'
```jsx
import React from 'react';
import { Home, Activity, BarChart2, Users, DollarSign } from 'react-feather';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

// Tailwind CSS classes for styling
const cardStyle = "p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600";
const iconStyle = "w-6 h-6 mr-4 inline-block";

// Sample data for line chart
const data = [{name: 'Jan', uv: 400, pv: 2400, amt: 2400}, {name: 'Feb', uv: 300, pv: 1398, amt: 2210}, {name: 'Mar', uv: 200, pv: 9800, amt: 2290}, {name: 'Apr', uv: 278, pv: 3908, amt: 2000}, {name: 'May', uv: 189, pv: 4800, amt: 2181}, {name: 'Jun', uv: 239, pv: 3800, amt: 2500}, {name: 'Jul', uv: 349, pv: 4300, amt: 2100}];

const Dashboard = () => (
  <div className="p-6">
    <div className="flex space-x-4">
      <div className={cardStyle}>
        <div className="flex">
          <Users className={iconStyle} />
          <h2 className="text-2xl">Total Customers</h2>
        </div>
        <p className="text-2xl">1000</p>
      </div>
      <div className={cardStyle}>
        <div className="flex">
          <DollarSign className={iconStyle} />
          <h2 className="text-2xl">Total Revenue</h2>
        </div>
        <p className="text-2xl">$5000</p>
      </div>
      <div className={cardStyle}>
        <div className="flex">
          <Activity className={iconStyle} />
          <h2 className="text-2xl">Recent Activity</h2>
        </div>
        <p className="text-2xl">5 new users</p>
      </div>
    </div>
    <div className="mt-6">
      <h2 className="text-2xl mb-2">Sales Trend</h2>
      <LineChart width={600} height={300} data={data} className="mx-auto">
        <Line type="monotone" dataKey="uv" stroke="#8884d8" />
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
      </LineChart>
    </div>
    <div className="mt-6">
      <h2 className="text-2xl mb-2">Recent Activity</h2>
      <ul className="space-y-2">
        <li>User A logged in</li>
        <li>User B made a purchase</li>
        <li>User C signed up</li>
      </ul>
    </div>
    <div className="mt-6">
      <h2 className="text-2xl mb-2">Navigation</h2>
      <ul className="space-y-2">
        <li><Home className={iconStyle} /> Home</li>
        <li><Users className={iconStyle} /> Customers</li>
        <li><BarChart2 className={iconStyle} /> Analytics</li>
      </ul>
    </div>
  </div>
);

export default Dashboard;
```
This code creates a simple dashboard with key metrics, a line chart for sales trends, a list of recent activities, and navigation links. It uses Tailwind CSS for styling and Lucide React for icons. The Recharts library is used for the line chart.