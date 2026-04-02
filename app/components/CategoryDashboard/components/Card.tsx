import React from 'react';
import { SvgIconComponent } from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
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
}

const Card: React.FC<CardProps> = ({ 
  title, 
  value, 
  color, 
  icon: Icon, 
  onClick, 
  isLoading = false,
  size = 'medium',
  secondaryValue,
  secondaryColor,
  secondaryLabel
}) => {
  const padding = size === 'large' ? '32px' : '20px';
  const titleSize = size === 'large' ? '16px' : '20px';
  const valueSize = size === 'large' ? '36px' : '24px';
  const secondaryValueSize = size === 'large' ? '20px' : '16px';
  const iconSize = size === 'large' ? '36px' : '32px';
  const iconPadding = size === 'large' ? '14px' : '12px';
  const iconBorderRadius = size === 'large' ? '12px' : '16px';

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: padding,
        width: '100%',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
        cursor: onClick ? (isLoading ? 'default' : 'pointer') : 'default',
        transition: 'all 0.2s ease-in-out'
      }}
      onClick={isLoading ? undefined : onClick}
      onMouseEnter={(e) => {
        if (!isLoading && onClick) {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 6px ${color}15`;
          (e.currentTarget as HTMLDivElement).style.borderColor = `${color}40`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading) {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E7EB';
        }
      }}
    >
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          borderRadius: '12px'
        }}>
          <CircularProgress size={40} style={{ color: color }} />
        </div>
      )}
      
      <div style={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          background: `${color}15`,
          borderRadius: '12px',
          padding: iconPadding,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          flexShrink: 0
        }}>
          <Icon sx={{ fontSize: iconSize, color: color }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 style={{ 
            margin: '0 0 4px 0',
            color: '#6B7280',
            fontSize: '13px',
            fontWeight: '600',
          }}>{title}</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ 
              fontSize: valueSize, 
              fontWeight: '700', 
              color: '#111827',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              {getCurrencySymbol()}{formatNumber(value || 0)}
            </span>
            {secondaryValue !== undefined && (
              <>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#D1D5DB',
                }}>
                  |
                </span>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: secondaryColor || '#6B7280',
                }}>
                  {secondaryLabel && `${secondaryLabel}: `}${formatNumber(secondaryValue)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card; 