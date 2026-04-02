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
  background: '#FFFFFF',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  border: '1px solid #E5E7EB',
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    borderColor: '#D1D5DB',
  },
}));

const HeaderBox = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  marginBottom: '12px',
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
          background: `${color}10`,
          borderRadius: '12px',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '4px',
          position: 'relative',
          zIndex: 1
        }}>
          {React.cloneElement(icon as React.ReactElement<any>, { 
            sx: { 
              fontSize: '28px', 
              color: color 
            } 
          })}
        </div>
        <div>
          <h3 style={{ 
            margin: '0 0 4px 0', 
            fontSize: '11px', 
            color: '#6B7280',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>{title}</h3>
          <p style={{ 
            margin: 0, 
            fontSize: '24px', 
            color: '#111827',
            fontWeight: 700,
            lineHeight: '1.1',
          }}>{value}</p>
          {subtitle && (
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: '11px', 
              color: '#9CA3AF',
              fontWeight: 500
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
    <Box sx={{ flexGrow: 1, mb: 4, mt: 2, pt: '96px' }}>
      <HeaderBox>

        <IconButton
          onClick={() => setOpen(!open)}
          size="small"
          sx={{
            color: '#4B5563',
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: '#F9FAFB',
              borderColor: '#D1D5DB',
              color: '#111827',
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
          gap: '12px',
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