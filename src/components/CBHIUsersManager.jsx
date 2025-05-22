import React, { useState, useReducer } from "react";
import EtDatePicker from "mui-ethiopian-datepicker";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Grid,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Edit } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const initialFormState = {
  mrn: "",
  id: "",
  goth: "",
  kebele: "",
  sdate: "",
  edate: "",
  referralNumber: "",
  letterNumber: "",
  examination: "",
};

const controllerError = (state, action) => {
  try {
    if (action.name === "Reset") {
      return initialFormState;
    } else {
      return { ...state, [action.name]: action.values };
    }
  } catch (error) {
    console.error("State Update Error: ", error);
  }
};

function CBHIUsersManager() {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formDataError, setFormDataError] = useReducer(
    controllerError,
    initialFormState
  );
  const [loading, setLoading] = useState(false);

  const handleOpen = (index = null) => {
    if (index !== null) {
      setFormData(users[index]);
      setEditingIndex(index);
    } else {
      setFormData(initialFormState);
      setEditingIndex(null);
    }
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setFormData(initialFormState);
    setFormDataError({ name: "Reset" });
    setEditingIndex(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mrn") {
      mrnCheck(name, value);
    } else {
      letterNumberCheck(name, value);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (
        formData?.mrn?.length <= 0 ||
        formData?.id?.length <= 0 ||
        formData?.kebele?.length <= 0
      ) {
        toast.error("Please Insert the required fields.");
        return;
      }

      if (Object.values(formDataError).some((em) => em.length > 0)) {
        toast.error("Please fix the errors first.");
        return;
      }

      if (editingIndex !== null) {
        const updated = [...users];
        updated[editingIndex] = formData;
        setUsers(updated);
      } else {
        setUsers((prev) => [...prev, formData]);
      }
      handleClose();
    } catch (error) {
      console.error("This is Submit Error: ", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "mrn", headerName: "MRN", flex: 1 },
    { field: "id", headerName: "ID", flex: 1 },
    { field: "kebele", headerName: "Woreda/Kebele", flex: 1 },
    { field: "referralNumber", headerName: "Referral No.", flex: 1 },
    { field: "letterNumber", headerName: "Letter No.", flex: 1 },
    { field: "examination", headerName: "Examination", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      renderCell: (params) => (
        <IconButton
          color="primary"
          onClick={() => handleOpen(params.row.index)}
        >
          <Edit />
        </IconButton>
      ),
      sortable: false,
      width: 100,
    },
  ];

  const rows = users.map((user, index) => ({ ...user, id: index, index }));

  const mrnCheck = (name, value) => {
    const comp = /^[0-9]{5,}$/;
    if (!comp.test(value) && value.length > 0) {
      setFormDataError({
        name: name,
        values: "Please Insert Valid MRN, more than 5 digit only.",
      });
    } else {
      setFormDataError({
        name: name,
        values: "",
      });
    }
  };

  const letterNumberCheck = (name, value) => {
    const comp = /^[a-zA-Z0-9\u1200-\u137F\s]+$/;
    if (!comp.test(value) && value.length > 0) {
      setFormDataError({
        name: name,
        values: "Letters Number and space Only.",
      });
    } else {
      setFormDataError({
        name: name,
        values: "",
      });
    }
  };

  const handleChangeTime = (fieldName, selectedDate) => {
    let jsDate;
    if (selectedDate instanceof Date) {
      jsDate = selectedDate;
    } else {
      jsDate = new Date(selectedDate);
    }

    if (isNaN(jsDate.getTime())) {
      console.error("Invalid date provided to handleChangeTime:", selectedDate);
      return;
    }

    const tzOffsetMinutes = jsDate.getTimezoneOffset();
    const absOffset = Math.abs(tzOffsetMinutes);
    const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, "0");
    const offsetMinutes = String(absOffset % 60).padStart(2, "0");
    const sign = tzOffsetMinutes <= 0 ? "+" : "-";

    const localDate = new Date(jsDate.getTime() - tzOffsetMinutes * 60000);
    const dateStr = localDate.toISOString().slice(0, 19).replace("T", " ");

    const sqlDateOffset = `${dateStr} ${sign}${offsetHours}:${offsetMinutes}`;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: sqlDateOffset,
    }));
  };

  return (
    <Box p={4}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" fontWeight="bold">
          CBHI Users Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Add CBHI User
        </Button>
      </Box>
      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        sx={{ boxShadow: 3, borderRadius: 2 }}
      />
      <Dialog
        open={openDialog}
        onClose={(event, reason) => {
          if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
            handleClose(); // Reset and close the modal
          }
        }}
        disablePortal={false} // default = false
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingIndex !== null ? "Edit" : "Add"} CBHI User
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            {[
              { label: "MRN", name: "mrn" },
              { label: "ID", name: "id" },
              { label: "Woreda/Kebele", name: "kebele" },
              { label: "Goth", name: "goth" },
              { label: "Start Date", name: "sdate" },
              { label: "End Date", name: "edate" },
              { label: "Referral Number", name: "referralNumber" },
              { label: "Letter Number", name: "letterNumber" },
              { label: "Examination", name: "examination" },
            ].map(({ label, name }) => (
              <Grid item xs={12} sm={6} key={name}>
                {["sdate", "edate"].includes(name) ? (

                    <EtDatePicker
                      label={label}
                      name={name}
                      value={formData[name] ? new Date(formData[name]) : null}
                      onChange={(e) => handleChangeTime(name, e)}
                      sx={{ width: "100%" }}
                    />

                ) : (
                  <TextField
                    fullWidth
                    variant="outlined"
                    label={label}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    multiline={label === "Examination" ? true : false}
                    rows={label === "Examination" ? 4 : 0}
                    required={
                      ["MRN", "ID", "Woreda/Kebele"].includes(label)
                        ? true
                        : false
                    }
                    error={!!formDataError[name]}
                    helperText={formDataError[name]}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained">
            {loading ? <CircularProgress size={24} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
      <ToastContainer />
    </Box>
  );
}
export default CBHIUsersManager;
