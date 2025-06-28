import React from 'react';
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
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

const MetricCard = styled(Paper)(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
  },
}));

const HeaderBox = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  marginBottom: '16px',
  padding: '0 4px',
});

const MetricItem: React.FC<{ 
  title: string; 
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => {
  return (
    <MetricCard>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '8px'
      }}>
        <div style={{
          backgroundColor: `${color}15`,
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '4px'
        }}>
          {React.cloneElement(icon as React.ReactElement, { 
            sx: { 
              fontSize: '24px', 
              color: color 
            } 
          })}
        </div>
        <div>
          <h3 style={{ 
            margin: '0 0 4px 0', 
            fontSize: '14px', 
            color: '#666',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>{title}</h3>
          <p style={{ 
            margin: 0, 
            fontSize: '24px', 
            color: color,
            fontWeight: 700,
            lineHeight: '1.2'
          }}>{value}</p>
          {subtitle && (
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: '12px', 
              color: '#888',
              fontWeight: 400
            }}>{subtitle}</p>
          )}
        </div>
      </div>
    </MetricCard>
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
    <Box sx={{ flexGrow: 1, mb: 4, mt: 2 }}>
      <HeaderBox>

        <IconButton
          onClick={() => setOpen(!open)}
          size="small"
          sx={{
            color: '#666',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.06)',
            },
          }}
        >
          {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
        </IconButton>
      </HeaderBox>
      <Collapse in={open}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <MetricItem
            title="Total Transactions"
            value={data?.allTransactions? data.allTransactions: "N/A"}
            icon={<ReceiptIcon />}
            color="#3b82f6"
            subtitle="All time"
          />
          <MetricItem
            title="Active Categories"
            value={data?.categories? data.categories: "N/A"}
            icon={<CategoryIcon />}
            color="#3b82f6"
            subtitle="In use"
          />
          <MetricItem
            title="Latest Activity"
            value={data.lastMonth?data.lastMonth:"N/A"}
            icon={<CalendarTodayIcon />}
            color="#3b82f6"
            subtitle="Last transaction"
          />
        </Box>
      </Collapse>
    </Box>
  );
};

export default MetricsPanel; 