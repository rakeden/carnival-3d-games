import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();

  return (
    <div className="min-h-svh flex flex-col">

      {/* Main Content */}
      {/* <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main> */}
      <main className="w-full h-full">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;