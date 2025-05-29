/**
 * Patient List Component
 * This component displays a list of patients with pagination
 */

import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Chip,
  Avatar,
  Button,
  Typography,
  CircularProgress
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Patient, PatientListResponse } from '../../../types/patient.types';

interface PatientListProps {
  data: PatientListResponse | null;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

const PatientList: React.FC<PatientListProps> = ({
  data,
  loading,
  error,
  onPageChange,
  onRowsPerPageChange
}) => {
  const navigate = useNavigate();
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage + 1); // API uses 1-based indexing
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(1); // Reset to first page
  };
  
  // Handle view patient
  const handleViewPatient = (id: string) => {
    navigate(`/patients/${id}`);
  };
  
  // Handle edit patient
  const handleEditPatient = (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering row click
    navigate(`/patients/${id}/edit`);
  };
  
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'deceased':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // If loading
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If error
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }
  
  // If no data
  if (!data || data.patients.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No patients found.</Typography>
      </Box>
    );
  }
  
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="patients table">
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>MRN</TableCell>
              <TableCell>ABHA ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.patients.map((patient: Patient) => (
              <TableRow
                key={patient.id}
                hover
                onClick={() => handleViewPatient(patient.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                    <Typography>
                      {`${patient.first_name} ${patient.last_name}`}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{calculateAge(patient.date_of_birth)}</TableCell>
                <TableCell>{patient.gender}</TableCell>
                <TableCell>
                  {patient.phone || patient.email || 'No contact info'}
                </TableCell>
                <TableCell>{patient.mrn || 'N/A'}</TableCell>
                <TableCell>{patient.abha_id || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={patient.status}
                    color={getStatusColor(patient.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => handleEditPatient(patient.id, e)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={data.pagination.total}
        rowsPerPage={data.pagination.limit}
        page={data.pagination.page - 1} // API uses 1-based indexing
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default PatientList;
