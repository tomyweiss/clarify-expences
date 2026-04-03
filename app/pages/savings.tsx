import React from "react";
import Head from "next/head";
import Layout from "../components/Layout";
import SavingsDashboard from "../components/SavingsDashboard";

const SavingsPage: React.FC = () => {
  return (
    <Layout>
      <Head>
        <title>Clarify - Savings Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SavingsDashboard />
    </Layout>
  );
};

export default SavingsPage;
