/**
 * Patient Search Component
 * This component provides search functionality for the patient list
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Divider,
  Typography
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { PatientSearchParams } from '../../../types/patient.types';

interface PatientSearchProps {
  onSearch: (params: PatientSearchParams) => void;
  initialParams?: PatientSearchParams;
}

const PatientSearch: React.FC<PatientSearchProps> = ({ onSearch, initialParams = {} }) => {
  // State for search input
  const [searchTerm, setSearchTerm] = useState(initialParams.search || '');

  // State for filter menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // State for filters
  const [status, setStatus] = useState(initialParams.status || '');
  const [sort, setSort] = useState(initialParams.sort || 'last_name');
  const [order, setOrder] = useState(initialParams.order || 'ASC');

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const params: PatientSearchParams = {
      search: searchTerm,
      status: status as 'active' | 'inactive' | 'deceased' | undefined,
      sort,
      order: order as 'ASC' | 'DESC'
    };

    onSearch(params);
  };

  // Handle filter menu open
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle filter menu close
  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  // Handle status change
  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatus(event.target.value);
  };

  // Handle sort change
  const handleSortChange = (event: SelectChangeEvent) => {
    setSort(event.target.value);
  };

  // Handle order change
  const handleOrderChange = (event: SelectChangeEvent) => {
    setOrder(event.target.value as 'ASC' | 'DESC');
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    const params: PatientSearchParams = {
      search: searchTerm,
      status: status as 'active' | 'inactive' | 'deceased' | undefined,
      sort,
      order: order as 'ASC' | 'DESC'
    };

    onSearch(params);
    handleFilterClose();
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setStatus('');
    setSort('last_name');
    setOrder('ASC');

    const params: PatientSearchParams = {
      search: searchTerm
    };

    onSearch(params);
    handleFilterClose();
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');

    const params: PatientSearchParams = {
      status: status as 'active' | 'inactive' | 'deceased' | undefined,
      sort,
      order: order as 'ASC' | 'DESC'
    };

    onSearch(params);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <form onSubmit={handleSearchSubmit}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search patients by name, MRN, ABHA ID..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear search"
                    onClick={handleClearSearch}
                    edge="end"
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={handleFilterClick}
            aria-controls={open ? 'filter-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            Filter
          </Button>

          <Button
            variant="contained"
            type="submit"
          >
            Search
          </Button>
        </Box>
      </form>

      <Menu
        id="filter-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleFilterClose}
        MenuListProps={{
          'aria-labelledby': 'filter-button',
        }}
        PaperProps={{
          sx: { width: 300, p: 2 }
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          Filters
        </Typography>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            id="status-select"
            value={status}
            label="Status"
            onChange={handleStatusChange}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="deceased">Deceased</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="sort-label">Sort By</InputLabel>
          <Select
            labelId="sort-label"
            id="sort-select"
            value={sort}
            label="Sort By"
            onChange={handleSortChange}
          >
            <MenuItem value="first_name">First Name</MenuItem>
            <MenuItem value="last_name">Last Name</MenuItem>
            <MenuItem value="date_of_birth">Date of Birth</MenuItem>
            <MenuItem value="created_at">Created Date</MenuItem>
            <MenuItem value="updated_at">Updated Date</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="order-label">Order</InputLabel>
          <Select
            labelId="order-label"
            id="order-select"
            value={order}
            label="Order"
            onChange={handleOrderChange}
          >
            <MenuItem value="ASC">Ascending</MenuItem>
            <MenuItem value="DESC">Descending</MenuItem>
          </Select>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleClearFilters}>
            Clear Filters
          </Button>
          <Button variant="contained" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default PatientSearch;
