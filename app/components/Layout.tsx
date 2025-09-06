import React from "react";
import ResponsiveAppBar from "./menu";
import { NotificationProvider } from "./NotificationContext";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <NotificationProvider>
      <div>
        <ResponsiveAppBar />
        <main>{children}</main>
      </div>
    </NotificationProvider>
  );
};

export default Layout;
