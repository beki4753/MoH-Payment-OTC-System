import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";

const contactMethods = ["EMAIL", "SMS"];

const EditStaffModal = ({ open, onClose, staffData, onSave }) => {
  const [editedData, setEditedData] = useState(() =>
    staffData !== undefined ? { ...staffData } : {}
  );

  useEffect(() => {
    setEditedData(staffData);
  }, [staffData]);

  const handleChange = (e) => {
    setEditedData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = () => {
    onSave(editedData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Staff</DialogTitle>
      <DialogContent dividers>
        <TextField
          margin="dense"
          label="Employee ID"
          name="employeeID"
          fullWidth
          value={editedData?.employeeID || ""}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          label="Name"
          name="employeeName"
          fullWidth
          value={editedData?.employeeName || ""}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          label="Phone"
          name="employeePhone"
          fullWidth
          value={editedData?.employeePhone || ""}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          label="Email"
          name="employeeEmail"
          fullWidth
          value={editedData?.employeeEmail || ""}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          label="Assigned As"
          name="assignedAs"
          fullWidth
          value={editedData?.assignedAs || ""}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          label="Assigned By"
          name="assignedBy"
          fullWidth
          value={editedData?.assignedBy || ""}
          onChange={handleChange}
        />
        <TextField
          select
          margin="dense"
          label="Contact Method"
          name="contactMethod"
          fullWidth
          value={editedData?.contactMethod || ""}
          onChange={handleChange}
        >
          {contactMethods.map((method) => (
            <MenuItem key={method} value={method}>
              {method}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditStaffModal;
