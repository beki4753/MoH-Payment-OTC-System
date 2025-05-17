import React, { useState } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Edit, Delete, Cancel, Save } from "@mui/icons-material";

const initialForm = {
  mrn: "",
  age: "",
  accidentDate: "",
  accidentAddress: "",
  carPlateNumber: "",
  policeName: "",
  policePhone: "",
};

function TrafficAccidentCrud() {
  const [formData, setFormData] = useState(initialForm);
  const [records, setRecords] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editIndex !== null) {
      const updated = [...records];
      updated[editIndex] = { ...formData, id: updated[editIndex].id };
      setRecords(updated);
      setEditIndex(null);
    } else {
      setRecords((prev) => [
        ...prev,
        { ...formData, id: Date.now() },
      ]);
    }
    setFormData(initialForm);
  };

  const handleEdit = (index) => {
    setFormData(records[index]);
    setEditIndex(index);
  };

  const handleDelete = (id) => {
    setRecords(records.filter((record) => record.id !== id));
    setFormData(initialForm);
    setEditIndex(null);
  };

  const handleCancelEdit = () => {
    setFormData(initialForm);
    setEditIndex(null);
  };

  const columns = [
    { field: "mrn", headerName: "MRN", flex: 1 },
    { field: "age", headerName: "Age", flex: 1 },
    { field: "accidentDate", headerName: "Date", flex: 1 },
    { field: "carPlateNumber", headerName: "Plate Number", flex: 1 },
    { field: "accidentAddress", headerName: "Address", flex: 2 },
    { field: "policeName", headerName: "Police Name", flex: 1 },
    { field: "policePhone", headerName: "Police Phone", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleEdit(records.findIndex(r => r.id === params.row.id))}>
            <Edit />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box p={3} component={Paper} sx={{marginInline:"15px"}} elevation={4} borderRadius={3}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        🚨 Traffic Accident Registration
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="MRN"
              name="mrn"
              value={formData.mrn}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              fullWidth
              required
              type="number"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Accident Date"
              name="accidentDate"
              value={formData.accidentDate}
              onChange={handleChange}
              fullWidth
              type="date"
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Car Plate Number"
              name="carPlateNumber"
              value={formData.carPlateNumber}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Accident Address"
              name="accidentAddress"
              value={formData.accidentAddress}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Police Name"
              name="policeName"
              value={formData.policeName}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Police Phone"
              name="policePhone"
              value={formData.policePhone}
              onChange={handleChange}
              fullWidth
              type="tel"
            />
          </Grid>
        </Grid>

        <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
          {editIndex !== null && (
            <Button variant="outlined" onClick={handleCancelEdit}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="contained">
            {editIndex !== null ? "Update" : "Register"}
          </Button>
        </Box>
      </form>

      <Box mt={5}>
        <Typography variant="h6" gutterBottom>
          Registered Records
        </Typography>
        <Box style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={records}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            localeText={{ noRowsLabel: "No traffic accident records to display" }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default TrafficAccidentCrud;