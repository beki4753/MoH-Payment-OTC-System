import React, { useState, useReducer, useEffect } from "react";
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
  FormHelperText,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Edit } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EtDatePicker from "mui-ethiopian-datepicker";
import { EthDateTime } from "ethiopian-calendar-date-converter";

// Replace with your actual token getter and API helper
import api from "../utils/api";
import { getTokenValue } from "../services/user_service";

const tokenvalue = getTokenValue();

const initialFormState = {
  mrn: "",
  id: "",
  goth: "",
  kebele: "",
  expDate: "",
  referralNumber: "",
  letterNumber: "",
  examination: "",
};

const controllerError = (state, action) => {
  if (action.name === "Reset") return initialFormState;
  return { ...state, [action.name]: action.values };
};

const requiredFields = {
  mrn: "MRN",
  id: "ID",
  kebele: "Woreda/Kebele",
  expDate: "Expiration Date",
};

function CBHIUsersManager() {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [formDataError, setFormDataError] = useReducer(
    controllerError,
    initialFormState
  );
  const [loading, setLoading] = useState(false);
  const [woredas, setWoredas] = useState([]);
  const [refresh, setReferesh] = useState(false);

  //Fetch Providers
  useEffect(() => {
    const fetchWoredas = async () => {
      try {
        const response = await api.get(`/Providers/list-providers`);
        if (response.status === 200) {
          setWoredas(response?.data?.map((item) => item.provider));
        }
      } catch (error) {
        console.error("Fetch woredas error:", error);
      }
    };
    fetchWoredas();
  }, []);

  //Get data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/Payment/get-service-provider`);
        if (response.status === 200) {
          const dataMod =
            response?.data?.length > 0
              ? response?.data?.sort((a, b) => b.id - a.id)
              : [];
          setUsers(dataMod);
        }
      } catch (error) {
        console.error("Fetch woredas error:", error);
      }
    };

    fetchData();
  }, [refresh]);

  const handleOpen = (data = null) => {
    if (data !== null) {
      const updateData = {
        mrn: data?.mrn,
        id: data?.idNo,
        goth: data?.goth,
        kebele: data?.provider,
        expDate: data?.expDate,
        referralNumber: data?.referalNo,
        letterNumber: data?.letterNo,
        examination: data?.examination,
      };
      setFormData(updateData);
    } else {
      setFormData(initialFormState);
    }
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setFormData(initialFormState);
    setFormDataError({ name: "Reset" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mrn") mrnCheck(name, value);
    else letterNumberCheck(name, value);

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const missingFields = Object.keys(requiredFields).filter(
        (key) => !formData[key]
      );

      if (missingFields.length > 0) {
        const fieldNames = missingFields
          .map((key) => requiredFields[key])
          .join(", ");

        missingFields?.map((item) => {
          setFormDataError({
            name: item,
            values: "Please fill this field",
          });
        });

        toast.error(
          `Please fill in the following required fields: ${fieldNames}`
        );
        return;
      }

      if (Object.values(formDataError).some((err) => err.length > 0)) {
        toast.error("Please fix the errors.");
        return;
      }

      const payload = {
        provider: formData?.kebele,
        service: "CBHI",
        kebele: formData?.kebele,
        goth: formData?.goth,
        idNo: formData?.id,
        referalNo: formData?.referralNumber,
        letterNo: formData?.letterNumber,
        examination: formData?.examination,
        expDate: formData?.expDate,
        cardNumber: formData?.mrn,
      };

      const response = await api.post("/Payment/add-service-provider", payload);
      if (response?.status === 201) {
        toast.success("CBHI User Regustered Success Fully.");
        setReferesh((prev) => !prev);
        handleClose();
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save user.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "mrn", headerName: "MRN", flex: 1 },
    { field: "idNo", headerName: "ID", flex: 1 },
    { field: "provider", headerName: "Woreda/Kebele", flex: 1 },
    { field: "goth", headerName: "Goth", flex: 1 },
    { field: "referalNo", headerName: "Referral No.", flex: 1 },
    { field: "letterNo", headerName: "Letter No.", flex: 1 },
    { field: "examination", headerName: "Examination", flex: 1 },
    {
      field: "expDate",
      headerName: "Expired Date",
      flex: 1,
      renderCell: (params) => {
        try {
          const rawDate = params?.row?.expDate;
          if (!rawDate) return "";

          const parsedDate = new Date(rawDate);

          const correctedDate = new Date(
            parsedDate.getTime() + 3 * 60 * 60 * 1000
          );

          const etDate = EthDateTime.fromEuropeanDate(correctedDate);

          return `${etDate.year}-${String(etDate.month).padStart(
            2,
            "0"
          )}-${String(etDate.date).padStart(2, "0")}`;
        } catch (err) {
          console.error("Date conversion error:", err);
          return "";
        }
      },
    },
  ];

  const mrnCheck = (name, value) => {
    const valid = /^[0-9]{5,}$/.test(value);
    setFormDataError({
      name,
      values: valid ? "" : "Please enter valid MRN (5+ digits).",
    });
  };

  const letterNumberCheck = (name, value) => {
    const valid = /^[a-zA-Z0-9\u1200-\u137F\s\\\/]+$/.test(value);
    setFormDataError({
      name,
      values: valid ? "" : "Letters and numbers and \\ / only.",
    });
  };

  const handleChangeTime = (fieldName, selectedDate) => {
    const jsDate = new Date(selectedDate);
    if (isNaN(jsDate.getTime())) return;
    const tzOffset = jsDate.getTimezoneOffset();
    const offsetStr = `${tzOffset <= 0 ? "+" : "-"}${String(
      Math.abs(tzOffset / 60)
    ).padStart(2, "0")}:${String(Math.abs(tzOffset % 60)).padStart(2, "0")}`;
    const localDate = new Date(jsDate.getTime() - tzOffset * 60000);
    const dateStr = localDate.toISOString().slice(0, 19).replace("T", " ");
    const sqlDateOffset = `${dateStr} ${offsetStr}`;
    setFormData((prev) => ({ ...prev, [fieldName]: sqlDateOffset }));
    setFormDataError({ name: fieldName, values: "" });
  };

  return (
    <Box p={4}>
      <ToastContainer />
      <Box display="flex" justifyContent="space-between" mb={2}>
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
        rows={users}
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
        fullWidth
        maxWidth="md"
        disableEnforceFocus // to remove focus warning
      >
        <DialogTitle>Add CBHI User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            {[
              { label: "MRN", name: "mrn" },
              { label: "ID", name: "id" },
              { label: "Woreda/Kebele", name: "kebele" },
              { label: "Goth", name: "goth" },
              { label: "Expired Date", name: "expDate" },
              { label: "Referral Number", name: "referralNumber" },
              { label: "Letter Number", name: "letterNumber" },
              { label: "Examination", name: "examination" },
            ].map(({ label, name }) => (
              <Grid item xs={12} sm={6} key={name}>
                {name === "expDate" ? (
                  <EtDatePicker
                    label={label}
                    name={name}
                    required
                    error={!!formDataError[name]}
                    helperText={formDataError[name]}
                    value={formData[name] ? new Date(formData[name]) : null}
                    onChange={(e) => handleChangeTime(name, e)}
                    sx={{ width: "100%" }}
                  />
                ) : name === "kebele" ? (
                  <FormControl required fullWidth error={!!formDataError[name]}>
                    <InputLabel>{label}</InputLabel>
                    <Select
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                      label={label}
                    >
                      {woredas.map((w) => (
                        <MenuItem key={w} value={w}>
                          {w}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{formDataError[name]}</FormHelperText>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    label={label}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    multiline={name === "examination"}
                    rows={name === "examination" ? 4 : 1}
                    required={["mrn", "id", "kebele"].includes(name)}
                    error={!!formDataError[name]}
                    helperText={formDataError[name]}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CBHIUsersManager;
