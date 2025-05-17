import React, { useReducer, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const initialState = {
  fname: "",
  fatname: "",
  gfatname: "",
  mobile: "",
};

const controller = (state, action) => {
  try {
    if (action.name === "Reset") {
      return initialState;
    } else {
      return { ...state, [action.name]: action.values };
    }
  } catch (error) {
    console.error("State Update Error: ", error);
  }
};

const controllerError = (state, action) => {
  try {
    if (action.name === "Reset") {
      return initialState;
    } else {
      return { ...state, [action.name]: action.values };
    }
  } catch (error) {
    console.error("State Update Error: ", error);
  }
};

const PatientSearch = () => {
  const theme = useTheme();
  const [formData, setFormData] = useReducer(controller, initialState);
  const [formDataError, setFormDataError] = useReducer(
    controllerError,
    initialState
  );
  const [loading, setLoading] = useState(false);
  const rows = [
    { id: 1, name: "bereket" },
    { id: 2, name: "bereket" },
  ];

  const columns = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "name", headerName: "Name", flex: 1 },
  ];

  const handleChange = (e) => {
    try {
      if (
        e.target.name === "fname" ||
        e.target.name === "fatname" ||
        e.target.name === "gfatname"
      ) {
        validateName(e.target.name, e.target.value);
      } else {
        validatePhoneNumber(e.target.name, e.target.value);
      }
      setFormData({ name: e.target.name, values: e.target.value });
    } catch (error) {
      console.error("The Handle Chnage Error: ", error);
      toast.error("Some thing went wrong.");
    }
  };

  const handleCancel = () => {
    setFormData({ name: "Reset" });
    setFormDataError({ name: "Reset" });
  };

  const hadndleSearch = async () => {
    try {
      setLoading(true);
      if (
        formData.fname.length <= 0 &&
        formData.fatname.length <= 0 &&
        formData.gfatname.length <= 0
      ) {
        toast.info("Please fill at least one of field to search.");
        return;
      } else if (Object.values(formDataError).some((em) => em.length > 0)) {
        toast.info("Please fix the errors first.");
        return;
      }
      console.log("formData >> : ", formData);
    } catch (error) {
      console.error("The Searching Error: ", error);
      toast.error(error?.response?.data?.message || "Internal server error.");
    } finally {
      setLoading(false);
    }
  };

 const validateName = (name, value) => {
    const usernameRegex = /^[A-Za-z]{3,}$/;
    if (!usernameRegex.test(value) && value.length > 0) {
      setFormDataError({
        name: name,
        values:
          "Name must be only letters, at least 3 characters long, and contain no spaces.",
      });
    } else {
      setFormDataError({
        name: name,
        values: "",
      });
    }
    return;
  };

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

  return (
    <div>
      <Box
        sx={{
          mx: "auto",
          p: { xs: 2, sm: 3 },
          mt: 4,
          borderRadius: 2,
          backgroundColor: "#f9f9f9",
          boxShadow: 3,
          marginInline:"15px"
        }}
      >
        <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              borderBottom: `2px solid ${theme.palette.primary.main}`,
              display: "inline-block",
              fontWeight: 600,
            }}
          >
            Patient Search
          </Typography>

          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="First Name"
                value={formData?.fname}
                name="fname"
                onChange={handleChange}
                error={!!formDataError?.fname}
                helperText={formDataError?.fname}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Father Name"
                value={formData?.fatname}
                name="fatname"
                onChange={handleChange}
                error={!!formDataError?.fatname}
                helperText={formDataError?.fatname}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Grand Father Name"
                value={formData?.gfatname}
                name="gfatname"
                onChange={handleChange}
                error={!!formDataError?.gfatname}
                helperText={formDataError?.gfatname}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Mobile"
                value={formData?.mobile}
                name="mobile"
                onChange={handleChange}
                error={!!formDataError?.mobile}
                helperText={formDataError?.mobile}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={hadndleSearch}
                sx={{ height: "100%" }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Search"
                )}
              </Button>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancel}
                fullWidth
                sx={{ height: "100%" }}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>

          <Typography
            variant="subtitle1"
            sx={{ mb: 1, fontWeight: 500, color: "text.secondary" }}
          >
            Patients Information
          </Typography>

          <Box sx={{ height: 300, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              disableSelectionOnClick
            />
          </Box>
        </Paper>
      </Box>
      <ToastContainer />
    </div>
  );
};

export default PatientSearch;
