import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Backdrop,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";

const AddUserModal = ({
  isOpen,
  onClose,
  onSubmit,
  userData,
  onEdit,
  resetUserData,
  role,
}) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmpassword: "",
    phone: "",
    role: "",
    department: "",
    usertype: "",
    hospital: "DB Tena tabiya",
  });

  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [confPassError, setConfPassError] = useState("");

  const departments = ["Card", "Pharmacy", "Hospital", "Tsedey Bank"];
  const hospitals = ["DB Tena tabiya"];
  //"DB Referral Hospital",  "DB Tena tabiya"
  const usertypes = ["Cashier", "Supervisor", "Admin"];
  // Reset form data when modal is closed
  const handleClose = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmpassword: "",
      phone: "",
      role: "",
      department: "",
      usertype: "",
      hospital: "DB Tena tabiya",
    });
    resetUserData();
    onClose(); // Close the modal
  };

  useEffect(() => {
    if (userData !== undefined || userData !== null) {
      setFormData({
        username: userData?.username,
        email: userData?.email,
        password: "", 
        confirmpassword: "",
        phone: userData?.phoneNumber,
        role: userData?.role,
        department: userData?.departement,
        usertype: userData?.userType,
        hospital: userData?.hospital,
      });
    }
  }, [userData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "email") {
      validateEmail(e.target.value);
    }
    if (e.target.name === "phone") {
      validatePhoneNumber(e.target.value);
    }
    if (e.target.name === "username") {
      validateUsername(e.target.value);
    }
    if(e.target.name === "confirmpassword")
    {
      setConfPassError("")
    }
  };

  const validateUsername = (username) => {
    const usernameRegex = /^[A-Za-z][A-Za-z0-9]{3,}$/;
    if (!usernameRegex.test(username)) {
      setUsernameError(
        "Username must start with a letter, be at least 3 characters long, and contain no spaces."
      );
    } else {
      setUsernameError("");
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zAZ0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(?:\+251|09|07)\d+$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError(
        "Phone number must start with +251, 09, or 07 and contain only numbers."
      );
    } else {
      if (phone.startsWith("+251") && phone.length !== 13) {
        setPhoneError("Phone number starting with +251 must have 13 digits.");
      } else if (
        (phone.startsWith("09") || phone.startsWith("07")) &&
        phone.length !== 10
      ) {
        setPhoneError(
          "Phone number starting with 09 or 07 must have 10 digits."
        );
      } else {
        setPhoneError("");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!usernameError && !emailError && !phoneError) {
      if (formData.password !== formData.confirmpassword) {
        setConfPassError("New Password and Confirm Password do not match.");
        return;
      }

      if (
        formData.department === "Tsedey Bank" &&
        formData.usertype === "Cashier"
      ) {
        toast.error(`Bank can't have Cashier user Type`);
        return;
      }

      if (userData) {
        onEdit(formData); // Call onEdit if it's an edit
      } else {
        onSubmit(formData); // Call onSubmit if it's a new user
      }
      // handleClose();
    } else {
      alert("Please fix the errors before submitting.");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      handleClose();
    }
  }, [isOpen]);

  return (
    <Modal
      open={isOpen}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          handleClose(); // Reset and close the modal
        }
      }}
      disableEscapeKeyDown
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
    >
      <Box sx={modalStyle}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {userData ? "Edit User" : "Add New User"}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Grid>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  margin="normal"
                  required
                  disabled={!!userData} // Disable Username field if editing
                  error={!!usernameError}
                  helperText={usernameError}
                />
              </Grid>
              <Grid item xs={8}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                  disabled={!!userData} // Disable Email field if editing
                  required
                  error={!!emailError}
                  helperText={emailError}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              margin="normal"
              error={!!phoneError}
              helperText={phoneError}
              disabled={!!userData} // Disable Phone Number field if editing
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  select
                  fullWidth
                  label="User Type"
                  name="usertype"
                  value={formData.usertype}
                  onChange={handleChange}
                  margin="normal"
                  disabled={!!userData}
                  required
                >
                  {usertypes.map((type, index) => (
                    <MenuItem key={index} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={8}>
                <TextField
                  select
                  fullWidth
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={!!userData}
                  margin="normal"
                  required
                >
                  {departments.map((dep, index) => (
                    <MenuItem key={index} value={dep}>
                      {dep}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <TextField
              select
              fullWidth
              label="Hospital Name"
              name="hospital"
              value={formData.hospital}
              onChange={handleChange}
              disabled={!!userData}
              margin="normal"
              required
            >
              {hospitals.map((hosp, index) => (
                <MenuItem key={index} value={hosp}>
                  {hosp}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              disabled={!!userData} // Disable password field if editing
            />
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmpassword"
              type="password"
              value={formData.confirmpassword}
              onChange={handleChange}
              margin="normal"
              error={!!confPassError}
              helperText={confPassError}
              required
              disabled={!!userData} // Disable password field if editing
            />
            <TextField
              select
              fullWidth
              label="Role"
              name="role"
              value={!!userData === true ? formData.role : "User"}
              onChange={handleChange}
              margin="normal"
              disabled={!!userData === true ? false : true}
              required
            >
              {role.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>

            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button onClick={handleClose} color="secondary" sx={{ mr: 2 }}>
                Close
              </Button>
              <Button type="submit" variant="contained" color="primary">
                {userData ? "Save Changes" : "Add User"}
              </Button>
            </Box>
          </form>
        </Grid>
      </Box>
    </Modal>
  );
};

// Modal Styles
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  borderRadius: 2,
};

export default AddUserModal;
