import React from 'react';
import { SvgIconComponent } from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { formatNumber, getCurrencySymbol } from '../utils/format';

interface CardProps {
  title: string;
  value: number;
  color: string;
  icon: SvgIconComponent;
  onClick?: () => void;
  isLoading?: boolean;
  size?: 'large' | 'medium';
  clickable?: boolean;
  secondaryValue?: number;
  secondaryColor?: string;
  secondaryLabel?: string;
  layout?: 'split' | 'stacked';
}

const Card: React.FC<CardProps> = ({ 
  title, 
  value, 
  color, 
  icon: Icon, 
  onClick, 
  isLoading, 
  size = 'medium',
  secondaryValue,
  secondaryColor,
  secondaryLabel,
  layout = 'stacked'
}) => {
  const isLarge = size === 'large';
  const iconSize = isLarge ? 32 : 24;
  const valueSize = isLarge ? '32px' : '26px';
  const iconPadding = isLarge ? '16px' : '12px';

  return (
    <div 
      onClick={onClick}
      style={{
        background: '#FFFFFF',
        borderRadius: '28px',
        padding: '20px 24px',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1.5px solid #F1F5F9',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = '#E2E8F0';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.02)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = '#F1F5F9';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {isLoading && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255, 255, 255, 0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '28px', zIndex: 10
        }}>
          <CircularProgress size={20} style={{ color: color }} />
        </div>
      )}

      {/* Header: Minimalist Labels & Large Colored Icon */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <h3 style={{ 
          margin: 0, 
          color: '#94A3B8', 
          fontSize: '15px', 
          fontWeight: '700', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em',
          fontFamily: "'Inter', sans-serif"
        }}>
          {title}
        </h3>
        <Icon sx={{ fontSize: '32px', color: color, opacity: 0.75 }} />
      </div>

      {/* Hero Value - Sharp & Established */}
      <div style={{ marginBottom: secondaryValue !== undefined ? '12px' : '0' }}>
        <span style={{ 
          fontSize: isLarge ? '32px' : '28px', 
          fontWeight: '800', 
          color: '#334155', 
          letterSpacing: '-0.04em', 
          lineHeight: 1,
          fontFamily: "'Outfit', sans-serif",
          display: 'block'
        }}>
          {getCurrencySymbol()}{formatNumber(value || 0)}
        </span>
      </div>

      {/* Secondary Metrics - Delicate footer */}
      {secondaryValue !== undefined && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
        }}>
          <Typography sx={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#BDBEC6',
            fontFamily: "'Inter', sans-serif"
          }}>
            <span style={{ fontWeight: 500 }}>{secondaryLabel || 'Total'}:</span> {getCurrencySymbol()}{formatNumber(secondaryValue)}
          </Typography>
        </div>
      )}
    </div>
  );
};

export default Card;