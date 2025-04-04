import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const Layout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      {/* <header className="sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold">Halkyonic</Link>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/" className={navigationMenuTriggerStyle()}>
                    Home
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/about" className={navigationMenuTriggerStyle()}>
                    About
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>
        </div>
      </header> */}

      {/* Main Content */}
      {/* <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main> */}
      <main className="w-full h-full">
        <Outlet />
      </main>

      {/* Footer */}
      {/* <footer className="border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            © {new Date().getFullYear()} Halkyonic. All rights reserved.
          </div>
        </div>
      </footer> */}
    </div>
  );
};

export default Layout;