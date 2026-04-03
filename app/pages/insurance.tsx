import React from "react";
import Head from "next/head";
import Layout from "../components/Layout";
import { Box, Typography } from "@mui/material";
import SecurityIcon from '@mui/icons-material/Security';

const InsurancePage: React.FC = () => {
  return (
    <Layout>
      <Head>
        <title>Clarify - Insurance Portfolio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 2,
        color: '#94A3B8'
      }}>
        <Box sx={{ 
          width: 64, 
          height: 64, 
          borderRadius: '20px', 
          backgroundColor: '#FFF', 
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1
        }}>
          <SecurityIcon sx={{ fontSize: 32, color: '#6366F1' }} />
        </Box>
        <Typography sx={{ 
          fontFamily: "'Outfit', sans-serif", 
          fontSize: '24px', 
          fontWeight: 700, 
          color: '#1E293B' 
        }}>
          Insurance Portfolio
        </Typography>
        <Typography sx={{ 
          fontFamily: "'Inter', sans-serif", 
          fontSize: '14px', 
          color: '#64748B' 
        }}>
          This feature is coming soon. Stay tuned!
        </Typography>
      </Box>
    </Layout>
  );
};

export default InsurancePage;
