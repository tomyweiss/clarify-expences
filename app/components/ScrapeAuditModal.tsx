import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import ModalHeader from './ModalHeader';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

interface ScrapeEvent {
  id: number;
  triggered_by: string | null;
  vendor: string;
  start_date: string;
  status: 'started' | 'success' | 'failed' | string;
  message: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ScrapeAuditModal({ open, onClose }: Props) {
  const [events, setEvents] = useState<ScrapeEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/scrape_events?limit=200');
      const data = await res.json();
      setEvents(data);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchEvents();
  }, [open]);

  const statusColor = (status: string) => {
    if (status === 'success') return 'success';
    if (status === 'failed') return 'error';
    return 'default';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        style: {
          background: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #E5E7EB'
        }
      }}
      BackdropProps={{
        style: {
          backgroundColor: 'rgba(17, 24, 39, 0.5)',
          backdropFilter: 'blur(4px)'
        }
      }}
    >
      <ModalHeader title="Scrape Audit" onClose={onClose} />
      <DialogContent style={{ padding: '0 32px 32px', color: '#111827', minHeight: '550px' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>Loading audit events...</Box>
        ) : events.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '32px', color: 'text.secondary' }}>No audit events found</Box>
        ) : (
          <Box sx={{ maxHeight: '450px', overflow: 'auto', paddingRight: '12px' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontWeight: 600 }}>Time</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Vendor</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Start Date</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Triggered By</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Message</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map(ev => (
                  <TableRow key={ev.id} sx={{ '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' } }}>
                    <TableCell>{new Date(ev.created_at).toLocaleString()}</TableCell>
                    <TableCell>{ev.vendor}</TableCell>
                    <TableCell>{new Date(ev.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{ev.triggered_by || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={ev.status} 
                        color={statusColor(ev.status) as any} 
                        size="small" 
                        sx={{ fontWeight: 500, borderRadius: '8px' }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.message || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
