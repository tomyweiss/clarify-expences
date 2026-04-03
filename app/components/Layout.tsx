import React from "react";
import AppShell from "./menu";
import { NotificationProvider } from "./NotificationContext";
import { ScrapeProvider } from "./ScrapeContext";
import ScrapeQueue from "./ScrapeQueue";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <NotificationProvider>
      <ScrapeProvider>
        <AppShell>
          {children}
        </AppShell>
        <ScrapeQueue />
      </ScrapeProvider>
    </NotificationProvider>
  );
};

export default Layout;
