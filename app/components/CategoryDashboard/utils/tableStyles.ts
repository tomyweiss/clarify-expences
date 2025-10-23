// Common table header cell styles
export const TABLE_HEADER_CELL_STYLE = {
  color: '#475569',
  borderBottom: '2px solid rgba(148, 163, 184, 0.2)',
  fontWeight: 600,
  fontSize: '13px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  padding: '16px'
};

// Common table body cell styles
export const TABLE_BODY_CELL_STYLE = {
  color: '#1e293b',
  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  fontWeight: 500,
  padding: '16px'
};

// Common table row hover styles
export const TABLE_ROW_HOVER_STYLE = {
  cursor: 'pointer' as const,
  transition: 'all 0.2s ease-in-out'
};

export const TABLE_ROW_HOVER_BACKGROUND = 'linear-gradient(135deg, rgba(96, 165, 250, 0.05) 0%, rgba(167, 139, 250, 0.05) 100%)';

