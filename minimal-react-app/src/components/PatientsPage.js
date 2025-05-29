import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Person as PersonIcon
} from '@mui/icons-material';

// Mock patient data
const createData = (id, name, age, gender, phone, lastVisit, condition, status) => {
  return { id, name, age, gender, phone, lastVisit, condition, status };
};

const mockPatients = [
  createData(1, 'Rahul Mehta', 45, 'Male', '+91 98765 43210', '15 May 2023', 'Diabetes', 'Active'),
  createData(2, 'Priya Sharma', 32, 'Female', '+91 87654 32109', '20 Jun 2023', 'Hypertension', 'Active'),
  createData(3, 'Vikram Singh', 58, 'Male', '+91 76543 21098', '05 Jul 2023', 'Arthritis', 'Active'),
  createData(4, 'Ananya Desai', 29, 'Female', '+91 65432 10987', '12 Jul 2023', 'Migraine', 'Active'),
  createData(5, 'Rajesh Kumar', 52, 'Male', '+91 54321 09876', '18 Jul 2023', 'Asthma', 'Inactive'),
  createData(6, 'Neha Patel', 36, 'Female', '+91 43210 98765', '25 Jul 2023', 'Thyroid', 'Active'),
  createData(7, 'Amit Verma', 41, 'Male', '+91 32109 87654', '02 Aug 2023', 'Cholesterol', 'Active'),
  createData(8, 'Kavita Gupta', 48, 'Female', '+91 21098 76543', '10 Aug 2023', 'Osteoporosis', 'Inactive'),
  createData(9, 'Sanjay Joshi', 55, 'Male', '+91 10987 65432', '15 Aug 2023', 'COPD', 'Active'),
  createData(10, 'Meera Reddy', 39, 'Female', '+91 09876 54321', '22 Aug 2023', 'Anemia', 'Active'),
];

const PatientsPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter patients based on search term
  const filteredPatients = mockPatients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };
  
  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f7fa' }}>
      <Typography variant="h4" color="primary" gutterBottom>
        Patients
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <TextField
            placeholder="Search patients..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearch}
            sx={{ width: '40%' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<FilterListIcon />}
              sx={{ mr: 1 }}
            >
              Filter
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
            >
              Add Patient
            </Button>
          </Box>
        </Box>
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="patients table">
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Last Visit</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                        {patient.name}
                      </Box>
                    </TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>{patient.gender}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>{patient.lastVisit}</TableCell>
                    <TableCell>{patient.condition}</TableCell>
                    <TableCell>
                      <Chip 
                        label={patient.status} 
                        color={patient.status === 'Active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPatients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default PatientsPage;
