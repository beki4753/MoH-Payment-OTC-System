import React, { useState, useReducer } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  Stack,
  Divider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Edit } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EtDatePicker from "mui-ethiopian-datepicker";
import { renderETDateAtCell } from "./PatientSearch";
import api from "../utils/api";

const initialForm = {
  mrn: "",
  age: "",
  accidentDate: "",
  accidentAddress: "",
  certificate: "",
  carPlateNumber: "",
  policeName: "",
  policePhone: "",
};

const controllerError = (state, action) => {
  try {
    if (action.name === "Reset") {
      return initialForm;
    } else {
      return { ...state, [action.name]: action.values };
    }
  } catch (error) {
    console.error("State Update Error: ", error);
  }
};

function TrafficAccidentCrud() {
  const [formData, setFormData] = useState(initialForm);
  const [formDataError, setFormDataError] = useReducer(
    controllerError,
    initialForm
  );

  const [records, setRecords] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mrn") {
      mrnCheck(name, value);
    } else if (name === "accidentAddress" || name === "carPlateNumber") {
      letterNumberCheck(name, value);
    } else if (name === "policeName") {
      validateName(name, value);
    } else if (name === "policePhone") {
      validatePhoneNumber(name, value);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    try {
      setLoading(true);
      e.preventDefault();

      if (Object.values(formDataError).some((em) => em.length > 0)) {
        toast.error("Please fix the erros first.");
        return;
      }
      const payload = {
        id: 0,
        patientCardNumber: formData?.mrn,
        accAddress: formData?.accidentAddress,
        accDate: formData?.accidentDate,
        policeName: formData?.policeName,
        policePhone: formData?.policePhone,
        plateNumber: formData?.carPlateNumber,
        certificate: formData?.certificate,
      };

      if (editIndex !== null) {
        const response = await api.put(
          "/Patient/change-patient-accedent",
          payload
        );

        console.log("This is updtae response: ", response);
        const updated = [...records];
        updated[editIndex] = { ...formData, id: updated[editIndex].id };
        setRecords(updated);
        setEditIndex(null);
      } else {
        const response = await api.post(
          "/Patient/add-patient-accedent",
          payload
        );
        if (response?.status === 200) {
          setRecords((prev) => [...prev, { ...formData, id: Date.now() }]);
        }
      }
      setFormData(initialForm);
    } catch (error) {
      console.error("This is Submit Error: ", error);
      toast.error(error?.reponse?.data?.message || "Internal Server Error.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index) => {
    setFormData(records[index]);
    setEditIndex(index);
  };

  const handleCancelEdit = () => {
    setFormData(initialForm);
    setFormDataError({ name: "Reset" });
    setEditIndex(null);
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

  const columns = [
    { field: "mrn", headerName: "MRN", flex: 1 },
    { field: "age", headerName: "Age", flex: 1 },

    {
      field: "accidentDate",
      headerName: "Date",
      flex: 1,
      renderCell: (params) => {
        return renderETDateAtCell(params?.row?.accidentDate);
      },
    },
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
          <IconButton
            onClick={() =>
              handleEdit(records.findIndex((r) => r.id === params.row.id))
            }
          >
            <Edit />
          </IconButton>
        </>
      ),
    },
  ];

  const validatePhoneNumber = (name, phone) => {
    const phoneRegex = /^(?:\+251|09|07)\d+$/;
    if (!phoneRegex.test(phone) && phone.length > 0) {
      setFormDataError({
        name: name,
        values:
          "Phone number must start with +251, 09, or 07 and contain only numbers.",
      });
    } else {
      if (phone.startsWith("+251") && phone.length !== 13) {
        setFormDataError({
          name: name,
          values: "Phone number starting with +251 must have 13 digits.",
        });
      } else if (
        (phone.startsWith("09") || phone.startsWith("07")) &&
        phone.length !== 10
      ) {
        setFormDataError({
          name: name,
          values: "Phone number starting with 09 or 07 must have 10 digits.",
        });
      } else {
        setFormDataError({
          name: name,
          values: "",
        });
      }
      return;
    }
  };

  const validateName = (name, value) => {
    const comp = /^[a-zA-Z\u1200-\u137F\s]{3,}$/;
    if (!comp.test(value) && value.length > 0) {
      setFormDataError({
        name: name,
        values: "Full Name must be only letters, at least 3 characters long.",
      });
    } else {
      setFormDataError({
        name: name,
        values: "",
      });
    }
    return;
  };

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

  return (
    <Box
      p={3}
      component={Paper}
      sx={{ marginInline: "15px" }}
      elevation={4}
      borderRadius={3}
    >
      <Typography variant="h5" gutterBottom fontWeight="bold">
        🚨 Traffic Accident Registration
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12}>
            <Stack
              direction="row"
              spacing={2}
              divider={<Divider orientation="vertical" flexItem />}
              sx={{ width: "100%" }}
            >
              {/* Left Section */}
              <Box sx={{ flex: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      color="primary"
                    >
                      Patient Information
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="MRN"
                      name="mrn"
                      value={formData?.mrn}
                      onChange={handleChange}
                      fullWidth
                      required
                      error={!!formDataError?.mrn}
                      helperText={formDataError?.mrn}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        height: "56px",
                        border: "1px dashed rgba(0,0,0,0.23)",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(0,0,0,0.6)",
                        fontStyle: "italic",
                        paddingBottom: "71px",
                      }}
                    >
                      {/* Placeholder */}
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      color="primary"
                    >
                      Car Information (if Known)
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Car Plate Number"
                      name="carPlateNumber"
                      value={formData?.carPlateNumber}
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.carPlateNumber}
                      helperText={formDataError?.carPlateNumber}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Certificate"
                      name="certificate"
                      value={formData?.certificate}
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.certificate}
                      helperText={formDataError?.certificate}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Right Section */}
              <Box sx={{ flex: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      color="primary"
                    >
                      Accident Information
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EtDatePicker
                      key={formData?.accidentDate || "accidentDate-date"}
                      label="Accident Date"
                      name="accidentDate"
                      value={
                        formData?.accidentDate
                          ? new Date(formData?.accidentDate)
                          : null
                      }
                      onChange={(e) => handleChangeTime("accidentDate", e)}
                      sx={{ width: "100%" }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Accident Address"
                      name="accidentAddress"
                      value={formData?.accidentAddress}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      rows={2}
                      required
                      error={!!formDataError?.accidentAddress}
                      helperText={formDataError?.accidentAddress}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      color="primary"
                    >
                      From the form filled out by the police
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Police Name"
                      name="policeName"
                      value={formData?.policeName}
                      onChange={handleChange}
                      fullWidth
                      required
                      error={!!formDataError?.policeName}
                      helperText={formDataError?.policeName}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Police Phone"
                      name="policePhone"
                      value={formData?.policePhone}
                      onChange={handleChange}
                      fullWidth
                      type="tel"
                      error={!!formDataError?.policePhone}
                      helperText={formDataError?.policePhone}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        {/* Buttons */}
        <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" color="error" onClick={handleCancelEdit}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : editIndex !== null ? (
              "Update"
            ) : (
              "Register"
            )}
          </Button>
        </Box>
      </form>

      <Box mt={5}>
        <Typography variant="h6" gutterBottom>
          Registered Records
        </Typography>
        <Box style={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={records}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            localeText={{
              noRowsLabel: "No traffic accident records to display",
            }}
          />
        </Box>
      </Box>
      <ToastContainer />
    </Box>
  );
}

export default TrafficAccidentCrud;
