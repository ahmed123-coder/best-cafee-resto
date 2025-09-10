import React from 'react';
import DashboardInStore from '../conponment/dashboardstore.jsx';
import Admin from './admin';

function Dashboard() {
  return (
    <div>
      <Admin />
      <DashboardInStore />
    </div>
  );
}

export default Dashboard;