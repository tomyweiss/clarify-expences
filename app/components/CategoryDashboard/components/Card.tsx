import React from 'react';
import { SvgIconComponent } from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
import { formatNumber } from '../utils/format';

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
  const iconSize = size === 'large' ? '24px' : '24px';
  const iconPadding = size === 'large' ? '10px' : '12px';
  const iconBorderRadius = size === 'large' ? '12px' : '16px';

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: padding,
        width: '100%',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        cursor: onClick ? (isLoading ? 'default' : 'pointer') : 'default',
        transition: 'all 0.3s ease-in-out'
      }}
      onClick={isLoading ? undefined : onClick}
      onMouseEnter={(e) => {
        if (!isLoading) {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading) {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
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
          borderRadius: '24px'
        }}>
          <CircularProgress size={40} style={{ color: color }} />
        </div>
      )}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: size === 'large' ? '100px' : '80px',
        height: size === 'large' ? '100px' : '80px',
        background: `radial-gradient(circle at top right, ${color}20, transparent 70%)`,
        opacity: size === 'large' ? 0.5 : 0.3
      }} />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: size === 'large' ? 'center' : 'flex-start',
        gap: '16px'
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: '0 0 12px 0',
            color: size === 'large' ? '#555' : '#333',
            fontSize: titleSize,
            fontWeight: size === 'large' ? '400' : '500',
            letterSpacing: size === 'large' ? 'normal' : '-0.01em',
            fontFamily: 'Assistant, sans-serif'
          }}>{title}</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <span style={{ 
              fontSize: valueSize, 
              fontWeight: size === 'large' ? '700' : '600', 
              color: color,
              letterSpacing: '-0.02em',
              fontFamily: 'Assistant, sans-serif'
            }}>
              ₪{formatNumber(value || 0)}
            </span>
            {secondaryValue !== undefined && (
              <>
                <span style={{ 
                  fontSize: valueSize, 
                  fontWeight: size === 'large' ? '700' : '600', 
                  color: '#E5E7EB',
                  letterSpacing: '-0.02em',
                  fontFamily: 'Assistant, sans-serif'
                }}>
                  |
                </span>
                <span style={{ 
                  fontSize: valueSize, 
                  fontWeight: size === 'large' ? '700' : '600', 
                  color: secondaryColor || '#666',
                  letterSpacing: '-0.02em',
                  fontFamily: 'Assistant, sans-serif'
                }}>
                  {secondaryLabel && `${secondaryLabel}: `}₪{formatNumber(secondaryValue)}
                </span>
              </>
            )}
          </div>
        </div>
        <div style={{
          backgroundColor: color + '20',
          borderRadius: iconBorderRadius,
          padding: iconPadding,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon sx={{ fontSize: iconSize, color: color }} />
        </div>
      </div>
    </div>
  );
};

export default Card; 