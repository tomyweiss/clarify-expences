import React from "react";
import ResponsiveAppBar from "./menu";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div>
      <ResponsiveAppBar />
      <main>{children}</main>
    </div>
  );
};

export default Layout;
