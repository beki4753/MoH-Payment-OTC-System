import React, { useReducer, useRef, useState } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
  Stack,
  Stepper,
  StepLabel,
  Step,
  Divider,
  Paper,
  CircularProgress,
} from "@mui/material";
import { EtLocalizationProvider } from "habesha-datepicker";
import EtDatePicker from "habesha-datepicker";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../utils/api";
import { getTokenValue } from "../services/user_service";

const tokenvalue = getTokenValue();

const steps = ["Basic Info", "Addres Info"];
const genders = ["Male", "Female"];
const Religions = [
  "UNKNOWN",
  "CHRISTIAN",
  "MUSLIM",
  "ORTHODOX",
  "PROTESTANT",
  "CATHOLIC",
  "OTHER",
  "NONE",
];

const Departments = [
  "OutPatient Clinic",
  "Family Planning Clinic",
  "Antenatal Care Clinic",
  "HIV/AIDS Clinic",
  "Tuberculosis Clinic",
  "Pediatrics Clinic",
  "Pharmacy",
  "Laboratory",
  "Postpartum Visit",
];

const Providers = [
  "OPDCLINIC",
  "ARTCLINIC",
  "VCTCLINIC",
  "LABORATORY",
  "OPDCLINIC2",
  "OPDCLINIC6",
  "OPDCLINICDENTAL",
  "PEDIATRICSWARD",
  "MEDICALA",
  "ANCCLINIC",
  "LABORDELIVERYWARD",
  "PEDIATRICSCLINIC",
  "OPDCLINICGETU",
  "MCHCLINICOPD",
  "MERRA-LAB",
  "MERRATEST1",
];

const MultipleB = ["UNKNOWN", "NO", "TWINS", "TRIPLETS OR MORE"];
const HighestE = [
  "NO EDUCATION",
  "PRIMARY",
  "SECONDARY",
  "TERTIARY",
  "NONE",
  "GRADE 1",
  "GRADE 2",
  "GRADE 3",
  "GRADE 4",
  "GRADE 5",
  "GRADE 6",
  "GRADE 7",
  "GRADE 8",
  "GRADE 9",
  "GRADE 10",
  "GRADE 11",
  "GRADE 12",
  "COLLEGE/UNIVERSITY",
];
const occupationList = [
  "Farmer",
  "Teacher",
  "Health Worker",
  "Nurse",
  "Doctor",
  "Midwife",
  "Engineer",
  "Civil Servant",
  "Police Officer",
  "Soldier",
  "Merchant",
  "Driver",
  "Construction Worker",
  "Daily Laborer",
  "Housemaid",
  "Student",
  "Unemployed",
  "Self-employed",
  "Tailor",
  "Weaver",
  "Potter",
  "Carpenter",
  "Electrician",
  "Mechanic",
  "Blacksmith",
  "Butcher",
  "Barber",
  "Hairdresser",
  "Taxi Driver",
  "Bus Conductor",
  "Security Guard",
  "Religious Leader",
  "Traditional Healer",
  "Agricultural Extension Worker",
  "NGO Worker",
  "Banker",
  "Accountant",
  "Shopkeeper",
  "Trader",
  "Hotel Worker",
  "Tour Guide",
  "Fisherman",
  "Livestock Keeper",
  "Miner",
  "Artist",
  "Musician",
  "Actor/Actress",
  "Craft Worker",
  "Mobile Technician",
  "IT Technician",
  "Software Developer",
  "Journalist",
  "Lawyer",
  "Judge",
  "Pharmacist",
  "Veterinarian",
  "Cleaner",
  "Retired",
];

const Marital = ["None", "Single", "Married", "Divorced", "Widowed"];
const ethiopianRegions = [
  "Addis Ababa",
  "Afar",
  "Amhara",
  "Benishangul-Gumuz",
  "Central Ethiopia",
  "Dire Dawa",
  "Gambela",
  "Harari",
  "Oromia",
  "Sidama",
  "South Ethiopia",
  "South West Ethiopia Peoples",
  "Somali",
  "Tigray",
];

const initialState = {
  fname: "",
  dob: "",
  edu: "",
  fatname: "",
  pbirth: "",
  occ: "",
  gfname: "",
  mbirth: "",
  mstatus: "",
  maname: "",
  religion: "",
  sname: "",
  sfname: "",
  gender: "",
  providers: "",
  vdate: "",
  dep: "",
  mrn: "",
  regin: "",
  nregion: "",
  woreda: "",
  nworeda: "",
  kebele: "",
  nkebele: "",
  hn: "",
  nhn: "",
  addD: "",
  naddD: "",
  phone: "",
  nphone: "",
  mobile: "",
  nmobile: "",
};

const controller = (state, action) => {
  try {
    if (action.name === "reset") {
      return initialState;
    } else {
      return { ...state, [action.name]: action.values };
    }
  } catch (error) {
    console.error("Error on State update : ", error);
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

function PatientRegistration() {
  const [formData, setFormData] = useReducer(controller, initialState);
  const [formDataError, setFormDataError] = useReducer(
    controllerError,
    initialState
  );
  const [activeStep, setActiveStep] = useState(0);
  const [checkLoading, setCheckLoading] = useState(false);

  const handleCancel = () => {
    setFormData({ name: "reset" });
    setFormDataError({ name: "Reset" });
    setActiveStep(0);
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

  const handleChange = (e) => {
    if (
      e.target.name === "fname" ||
      e.target.name === "fatname" ||
      e.target.name === "gfname" ||
      e.target.name === "maname" ||
      e.target.name === "sname" ||
      e.target.name === "sfname"
    ) {
      validateName(e.target.name, e.target.value);
    } else if (e.target.name === "pbirth") {
      onlyLetterCheck(e.target.name, e.target.value);
    } else if (
      e.target.name === "woreda" ||
      e.target.name === "nworeda" ||
      e.target.name === "kebele" ||
      e.target.name === "nkebele" ||
      e.target.name === "addD" ||
      e.target.name === "naddD" ||
      e.target.name === "hn" ||
      e.target.name === "nhn"
    ) {
      letterNumberCheck(e.target.name, e.target.value);
    } else if (e.target.name === "mrn") {
      mrnCheck(e.target.name, e.target.value);
    } else if (e.target.name === "phone" || e.target.name === "nphone") {
      phoneCheck(e.target.name, e.target.value);
    } else if (e.target.name === "mobile" || e.target.name === "nmobile") {
      validatePhoneNumber(e.target.name, e.target.value);
    }
    setFormData({ name: e.target.name, values: e.target.value });
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

  const phoneCheck = (name, value) => {
    const check = /^(?:\(?\d{2,4}\)?[\s-]?)?\d{5,8}$/;
    if (!check.test(value) && value.length > 0) {
      setFormDataError({
        name: name,
        values:
          "Insert like (011) 2345678 , 011-2345678 , 2345678 , 0123 45678",
      });
    } else {
      setFormDataError({
        name: name,
        values: "",
      });
    }
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

  const onlyLetterCheck = (name, value) => {
    const comp = /^[A-Za-z\s]+$/;
    if (!comp.test(value) && value.length > 0) {
      setFormDataError({
        name: name,
        values: "Please Insert Only Letters.",
      });
    } else {
      setFormDataError({
        name: name,
        values: "",
      });
    }
  };

  const letterNumberCheck = (name, value) => {
    const comp = /^[A-Za-z0-9\s]+$/;
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

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      console.log("Submitting: " + JSON.stringify(formData, null, 2));
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleCheck = async () => {
    try {
      setCheckLoading(true);
      if (formDataError?.mrn?.length > 0 || formData?.mrn?.length <= 0) {
        toast.error("Please Insert Valid MRN first.");
        return;
      }
      const response = await api.put("/Patient/get-patient-info", {
        patientCardNumber: formData?.mrn,
        patientFirstName: "-",
        patientLastName: "-",
        patientMiddleName: "-",
        patientPhone: "-",
        cashier: tokenvalue?.name,
      });

      console.log("Search Logic for: ", response);
    } catch (error) {
      console.error("This Is CHeck Error: ", error);
      toast.error(error?.reponse?.data?.message || "Internal Server Error.");
    } finally {
      setCheckLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TextField
                label="MRN"
                name="mrn"
                type="text"
                value={formData?.mrn}
                onChange={handleChange}
                error={!!formDataError?.mrn}
                helperText={formDataError?.mrn}
                required
              />
              <Button
                variant="contained"
                sx={{ marginInline: "15px" }}
                onClick={() => handleCheck()}
              >
                {checkLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Check"
                )}
              </Button>
            </Grid>

            <hr style={{ margin: "20px" }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="First Name *"
                  type="text"
                  name="fname"
                  value={formData?.fname}
                  onChange={handleChange}
                  error={!!formDataError?.fname}
                  helperText={formDataError?.fname}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <EtLocalizationProvider localType="EC">
                  <EtDatePicker
                    label="Date of Birth *"
                    name="dob"
                    value={formData?.dob ? new Date(formData?.dob) : null}
                    onChange={(e) => handleChangeTime("dob", e)}
                    sx={{ width: "100%" }}
                  />
                </EtLocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  value={formData.edu}
                  name="edu"
                  onChange={handleChange}
                  label="Highest Education Level Attained"
                  fullWidth
                >
                  {HighestE.map((he) => (
                    <MenuItem key={he} value={he}>
                      {he}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Father's Name *"
                  type="text"
                  name="fatname"
                  value={formData?.fatname}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!formDataError?.fatname}
                  helperText={formDataError?.fatname}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Place of Birth"
                  type="text"
                  value={formData?.pbirth}
                  name="pbirth"
                  onChange={handleChange}
                  error={!!formDataError?.pbirth}
                  helperText={formDataError?.pbirth}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Occupation"
                  value={formData.occ}
                  name="occ"
                  onChange={handleChange}
                  fullWidth
                >
                  {occupationList.map((ol) => (
                    <MenuItem key={ol} value={ol}>
                      {ol}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  type="text"
                  label="Grandfather's Name"
                  value={formData?.gfname}
                  name="gfname"
                  onChange={handleChange}
                  error={!!formDataError?.gfname}
                  helperText={formDataError?.gfname}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  value={formData.mbirth}
                  label="Multiple Birth"
                  name="mbirth"
                  onChange={handleChange}
                  fullWidth
                >
                  {MultipleB.map((mb) => (
                    <MenuItem key={mb} value={mb}>
                      {mb}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  value={formData.mstatus}
                  fullWidth
                  label="Marital Status"
                  name="mstatus"
                  onChange={handleChange}
                >
                  {Marital.map((ms) => (
                    <MenuItem key={ms} value={ms}>
                      {ms}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  type="text"
                  label="Mother's First Name"
                  value={formData?.maname}
                  fullWidth
                  name="maname"
                  onChange={handleChange}
                  error={!!formDataError?.maname}
                  helperText={formDataError?.maname}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  value={formData.religion}
                  name="religion"
                  onChange={handleChange}
                  label="Religion"
                  fullWidth
                >
                  {Religions.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  type="text"
                  label="Spouse's First Name"
                  value={formData?.sname}
                  name="sname"
                  fullWidth
                  onChange={handleChange}
                  error={!!formDataError?.sname}
                  helperText={formDataError?.sname}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Gender *"
                  value={formData.gender}
                  name="gender"
                  onChange={handleChange}
                  fullWidth
                  required
                >
                  {genders.map((g) => (
                    <MenuItem key={g} value={g}>
                      {g}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Grid container direction="column" spacing={1}>
                  <Grid item>
                    <Typography variant="subtitle1" fontWeight="bold">
                      *Appointment / Assignment
                    </Typography>
                  </Grid>
                  <Grid item>
                    <TextField
                      select
                      value={formData.providers}
                      name="providers"
                      label="Providers *"
                      onChange={handleChange}
                      fullWidth
                      required
                    >
                      {Providers.map((p) => (
                        <MenuItem key={p} value={p}>
                          {p}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  type="text"
                  label="Spouse's Father's Name"
                  value={formData?.sfname}
                  name="sfname"
                  fullWidth
                  onChange={handleChange}
                  error={!!formDataError?.sfname}
                  helperText={formDataError?.sfname}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <EtLocalizationProvider localType="EC">
                  <EtDatePicker
                    label="Visit Date"
                    name="vdate"
                    value={formData?.vdate ? new Date(formData?.vdate) : ""}
                    onChange={(e) => handleChangeTime("vdate", e)}
                    sx={{ width: "100%" }}
                  />
                </EtLocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Departments"
                  value={formData.dep}
                  name="dep"
                  fullWidth
                  required
                  onChange={handleChange}
                >
                  {Departments.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </>
        );
      case 1:
        return (
          <>
            <Stack
              direction="row"
              spacing={2}
              divider={<Divider orientation="vertical" flexItem />}
            >
              {/* Left Section */}
              <Box flex={1}>
                <Typography gutterBottom variant="subtitle1" fontWeight="bold">
                  Patient Current Address
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      value={formData.regin}
                      name="region"
                      onChange={handleChange}
                      label="Region"
                      fullWidth
                      required
                    >
                      {ethiopianRegions.map((r) => (
                        <MenuItem key={r} value={r}>
                          {r}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Woreda/Subcity"
                      value={formData?.woreda}
                      name="woreda"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.woreda}
                      helperText={formDataError?.woreda}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Kebele"
                      value={formData?.kebele}
                      name="kebele"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.kebele}
                      helperText={formDataError?.kebele}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="House #/Peasant Association#"
                      value={formData.hn}
                      name="hn"
                      onChange={handleChange}
                      error={!!formDataError?.hn}
                      helperText={formDataError?.hn}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Address Details"
                      multiline
                      value={formData?.addD}
                      name="addD"
                      onChange={handleChange}
                      rows={4}
                      fullWidth
                      error={!!formDataError?.addD}
                      helperText={formDataError?.addD}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Phone"
                      value={formData?.phone}
                      name="phone"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.phone}
                      helperText={formDataError?.phone}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Mobile Phone"
                      value={formData?.mobile}
                      name="mobile"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.mobile}
                      helperText={formDataError?.mobile}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Right Section */}
              <Box flex={1}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Next of Kin
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      value={formData.nregion}
                      name="nregion"
                      onChange={handleChange}
                      label="Region"
                      fullWidth
                      required
                    >
                      {ethiopianRegions.map((r) => (
                        <MenuItem key={r} value={r}>
                          {r}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Woreda/Subcity"
                      value={formData?.nworeda}
                      name="nworeda"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.nworeda}
                      helperText={formDataError?.nworeda}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Kebele"
                      value={formData?.nkebele}
                      name="nkebele"
                      onChange={handleChange}
                      fullWidth
                      required
                      error={!!formDataError?.nkebele}
                      helperText={formDataError?.nkebele}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="House #/Peasant Association#"
                      value={formData?.nhn}
                      name="nhn"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.nhn}
                      helperText={formDataError?.nhn}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Address Details"
                      value={formData?.naddD}
                      name="naddD"
                      onChange={handleChange}
                      multiline
                      rows={4}
                      fullWidth
                      error={!!formDataError?.naddD}
                      helperText={formDataError?.naddD}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Phone"
                      value={formData.nphone}
                      name="nphone"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.nphone}
                      helperText={formDataError?.nphone}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Mobile Phone"
                      value={formData?.nmobile}
                      name="nmobile"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.nmobile}
                      helperText={formDataError?.nmobile}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div>
        <Box
          sx={{
            mx: "auto",
            p: 3,
            marginInline: "15px",
            border: "1px solid #ccc",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Patient Registration Form
          </Typography>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box mt={3}>{renderStepContent(activeStep)}</Box>
          {/* Buttons */}
          <Box
            sx={{
              mt: 3,
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button variant="contained" onClick={handleNext}>
              {activeStep === steps.length - 1 ? "Submit" : "Next"}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleCancel()}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </div>
      <ToastContainer />
    </>
  );
}
export default PatientRegistration;
