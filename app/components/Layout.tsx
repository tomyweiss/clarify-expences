import React from "react";
import ResponsiveAppBar from "./menu";
import { NotificationProvider } from "./NotificationContext";
import ScrapeQueue from "./ScrapeQueue";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <NotificationProvider>
      <div>
        <ResponsiveAppBar />
        <main>{children}</main>
        <ScrapeQueue />
      </div>
    </NotificationProvider>
  );
};

export default Layout;
