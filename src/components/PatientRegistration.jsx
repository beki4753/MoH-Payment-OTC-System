import React, { useEffect, useReducer } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
} from "@mui/material";

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
};

const controler = (state, action) => {
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

function PatientRegistration() {
  const [formData, setFormData] = useReducer(controler, initialState);

  useEffect(() => {
    console.log("formData: ", formData);
  }, [formData]);

  const handleCancel = () => {
    setFormData({ name: "reset" });
  };

  const handleChange = (e) => {
    setFormData({ name: e.target.name, values: e.target.value });
  };
  return (
    <>
    <div >
      <Box
        sx={{
          mx: "auto",
          p: 3,
          marginInline:"15px",
          border: "1px solid #ccc",
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Patient Registration Form
        </Typography>
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
            value={formData.mrn}
            onChange={handleChange}
          />
        </Grid>

        <hr style={{ margin: "20px" }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="First Name *"
              type="text"
              name="fname"
              value={formData.fname}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Date of Birth *"
              fullWidth
              InputLabelProps={{ shrink: true }}
              name="dob"
              value={formData.dob}
              type="date"
              onChange={handleChange}
              required
            />
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
              value={formData.fatname}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Place of Birth"
              type="text"
              value={formData.pbirth}
              name="pbirth"
              onChange={handleChange}
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
              value={formData.gfname}
              name="gfname"
              onChange={handleChange}
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
              value={formData.maname}
              fullWidth
              name="maname"
              onChange={handleChange}
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
              value={formData.sname}
              name="sname"
              fullWidth
              onChange={handleChange}
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
                  Appointment / Assignment
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
              value={formData.sfname}
              name="sfname"
              fullWidth
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Visit Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.vdate}
              name="vdate"
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              type="text"
              label="Departments"
              value={formData.dep}
              name="dep"
              fullWidth
              onChange={handleChange}
            />
          </Grid>
        </Grid>

        {/* Buttons */}
        <Box
          sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}
        >
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleCancel()}
          >
            Cancel
          </Button>
          <Button variant="contained" color="primary">
            Save
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          mx: "auto",
          marginInline: "15px",
          p: 3,
          border: "1px solid #ccc",
          borderRadius: 2,
        }}
      >
        <Typography>Beki</Typography>
      </Box>
      </div>
    </>
  );
}
export default PatientRegistration;
