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
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '28px',
        padding: padding,
        width: '100%',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        cursor: onClick ? (isLoading ? 'default' : 'pointer') : 'default',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onClick={isLoading ? undefined : onClick}
      onMouseEnter={(e) => {
        if (!isLoading && onClick) {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-8px) scale(1.03)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px ${color}20`;
          (e.currentTarget as HTMLDivElement).style.borderColor = `${color}80`;
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255, 255, 255, 0.98)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading) {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0) scale(1)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.04)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(148, 163, 184, 0.15)';
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255, 255, 255, 0.95)';
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
        width: size === 'large' ? '140px' : '100px',
        height: size === 'large' ? '140px' : '100px',
        background: `radial-gradient(circle at top right, ${color}25, ${color}10 50%, transparent 70%)`,
        opacity: size === 'large' ? 0.6 : 0.4,
        filter: 'blur(20px)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: size === 'large' ? '100px' : '70px',
        height: size === 'large' ? '100px' : '70px',
        background: `radial-gradient(circle at bottom left, ${color}15, transparent 60%)`,
        opacity: 0.3,
        filter: 'blur(15px)'
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
            color: '#64748b',
            fontSize: titleSize,
            fontWeight: size === 'large' ? '600' : '700',
            letterSpacing: size === 'large' ? 'normal' : '-0.01em',
            fontFamily: 'Assistant, sans-serif',
            textShadow: 'none'
          }}>{title}</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <span style={{ 
              fontSize: valueSize, 
              fontWeight: size === 'large' ? '800' : '700', 
              color: color,
              letterSpacing: '-0.02em',
              fontFamily: 'Assistant, sans-serif',
              textShadow: `0 2px 12px ${color}60`
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
          background: `linear-gradient(135deg, ${color}40 0%, ${color}25 100%)`,
          borderRadius: iconBorderRadius,
          padding: iconPadding,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 6px 20px ${color}40`,
          border: `1px solid ${color}50`,
          position: 'relative',
          zIndex: 1
        }}>
          <Icon sx={{ fontSize: iconSize, color: color, filter: `drop-shadow(0 2px 8px ${color}60)` }} />
        </div>
      </div>
    </div>
  );
};

export default Card; 