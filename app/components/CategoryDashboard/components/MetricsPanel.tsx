import React from 'react';
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid2";
import { styled } from "@mui/material/styles";
import { useEffect } from "react";
import { BoxPanelData } from '../types';
import { dateUtils } from '../utils/dateUtils';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CategoryIcon from '@mui/icons-material/Category';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  },
}));

const HeaderBox = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
  padding: '0 8px',
});

const MetricCard: React.FC<{ 
  title: string; 
  metricName: string; 
  value: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, metricName, value, icon, color }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '12px', 
          color: '#777',
          fontWeight: 500
        }}>{title}</h3>
        <div style={{
          backgroundColor: `${color}20`,
          borderRadius: '8px',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {React.cloneElement(icon as React.ReactElement, { 
            sx: { 
              fontSize: '16px', 
              color: color 
            } 
          })}
        </div>
      </div>
      <h2 style={{ 
        margin: '0 0 4px 0', 
        fontSize: '18px', 
        color: '#333',
        fontWeight: 600
      }}>{metricName}</h2>
      <p style={{ 
        margin: 0, 
        fontSize: '24px', 
        color: color,
        fontWeight: 700
      }}>{value}</p>
    </div>
  );
};

const MetricsPanel: React.FC = () => {
  const [data, setData] = React.useState<BoxPanelData>({
    allTransactions: "",
    nonMapped: "",
    categories: "",
    lastMonth: "",
  });
  const [open, setOpen] = React.useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/box_panel_data");
      const result = await response.json();
      setData(result as BoxPanelData);
    } catch (error) {
      console.error("Error fetching metrics data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Box sx={{ flexGrow: 1, mb: 8, mt: 4 }}>
      <HeaderBox>
        <h2 style={{ 
          margin: 0, 
          fontSize: '20px', 
          color: '#333',
          fontWeight: 600
        }}>Overview</h2>
        <IconButton
          onClick={() => setOpen(!open)}
          sx={{
            color: '#555',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          }}
        >
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </HeaderBox>
      <Collapse in={open}>
        <Grid container spacing={3} justifyContent="center">
          <Grid size={3}>
            <Item>
              <MetricCard
                title="Total Transactions"
                metricName="Transactions"
                value={data?.allTransactions? data.allTransactions: "N/A"}
                icon={<ReceiptIcon />}
                color="#3b82f6"
              />
            </Item>
          </Grid>
          <Grid size={3}>
            <Item>
              <MetricCard
                title="Uncategorized"
                metricName="Non-Mapped"
                value={data?.nonMapped? data.nonMapped: "N/A"}
                icon={<MonetizationOnIcon />}
                color="#3b82f6"
              />
            </Item>
          </Grid>
          <Grid size={3}>
            <Item>
              <MetricCard
                title="Active Categories"
                metricName="Categories"
                value={data?.categories? data.categories: "N/A"}
                icon={<CategoryIcon />}
                color="#3b82f6"
              />
            </Item>
          </Grid>
          <Grid size={3}>
            <Item>
              <MetricCard
                title="Latest Activity"
                metricName="Last Transaction"
                value={data.lastMonth?data.lastMonth:"N/A"}
                icon={<CalendarTodayIcon />}
                color="#3b82f6"
              />
            </Item>
          </Grid>
        </Grid>
      </Collapse>
    </Box>
  );
};

export default MetricsPanel; 