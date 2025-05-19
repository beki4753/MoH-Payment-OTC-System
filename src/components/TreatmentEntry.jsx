import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
  Chip,
  ListItemText,
  ListSubheader,
  Select,
  Checkbox,
  CircularProgress,
  Paper,
} from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import SearchIcon from "@mui/icons-material/Search";
import { DataGrid } from "@mui/x-data-grid";
import api from "../utils/api";
import { useLang } from "../contexts/LangContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const treatmentCategories = ["Laboratory", "X-ray/Ultrasound", "Other"];

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;

/*NO AUTO‑FOCUS  – we also disable the menu’s “auto‑focus first item”  */
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
  /* This stops MUI from focusing the first <MenuItem> automatically */
  MenuListProps: {
    autoFocusItem: false,
  },
};
const initialState = {
  cardNumber: "",
  category: "",
  amount: [],
  reason: [],
};
const errorStates = {
  cardNumber: "",
  cardNumberSearch: "",
  fullNameSearch: "",
};
const TreatmentEntry = () => {
  const { language } = useLang();
  const [treatmentList, setTreatmentList] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [fullReasons, setFullReasons] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [formDataError, setFormDataError] = useState(errorStates);
  const [searchText, setSearchText] = useState("");
  const [cardNumberSearch, setCardNumberSearch] = useState("");
  const [fullNameSearch, setFullNameSearch] = useState("");
  const [filteredList, setFilteredList] = useState([]);
  const [saveLoading, setSaveloading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [markDoneLoading, setMarkDoneLoading] = useState(false);

  //Main Patient Searching Logic
  const handleSearch = async () => {
    try {
      setSearchLoading(true);
      if (
        formDataError?.cardNumberSearch?.length > 0 ||
        formDataError.fullNameSearch.length > 0
      ) {
        toast.error("Please fix the error first.");
        return;
      }

      if (cardNumberSearch.length <= 0 || fullNameSearch.length <= 0) {
        toast.error("Please Write in the fields first.");
        return;
      }

      console.log("Searching for:", {
        cardNumberSearch,
        fullNameSearch,
      });

      const normalize = (text) => (text || "").toString().trim().toLowerCase();
      // setFilteredList()
      const filteredList1 = treatmentList.filter((t) => {
        const cardMatch = cardNumberSearch
          ? normalize(t.cardNumber).includes(normalize(cardNumberSearch))
          : true;

        const nameMatch = fullNameSearch
          ? normalize(t.fullName).includes(normalize(fullNameSearch))
          : true;

        return cardMatch && nameMatch;
      });
      setFilteredList(filteredList1);
    } catch (error) {
      console.error("This is Search Error: ", error);
      toast.error(error?.response?.data?.message || "Internal Server Error.");
    } finally {
      setSearchLoading(false);
    }
  };

  //List Searching Logic
  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  const handleCancel = () => {
    setFormData(initialState);
    setFormDataError(errorStates);
  };

  const handleCheckboxChange = (event) => {
    try {
      const values = event.target.value;

      setFormData((prev) => {
        return {
          ...prev,
          reason: values,
          amount: values.map((item) => ({
            purpose: item,
            Amount: fullReasons
              .filter((itm) => itm.purpose === item)
              .map((item) => item.amount)[0],
          })),
        };
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleSave = async () => {
    try {
      setSaveloading(true);
      if (formDataError.cardNumber.length > 0) {
        toast.error("Please fix the Card Number Error.");
        return;
      }

      if (
        formData?.cardNumber &&
        formData?.category &&
        formData?.reason.length > 0
      ) {
        setTreatmentList((prev) => [
          ...prev,
          {
            id: Date.now(),
            cardNumber: formData.cardNumber,
            category: formData.category,
            reason: formData.reason,
            amount: formData.amount,
            status: "Pending",
            date: new Date().toLocaleString(),
          },
        ]);

        setFormData(initialState);
      }
    } catch (error) {
      console.error("This is Save Error: ", error);
      toast.error(error?.response?.data?.message || "Internal Server Error.");
    } finally {
      setSaveloading(false);
    }
  };

  //fetch Reasons
  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const response = await api.get("/Lookup/payment-purpose");
        if (response?.status === 200) {
          setReasons(response?.data?.map((item) => item.purpose));
          setFullReasons(response?.data);
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchReasons();
  }, []);

  const filteredReason = searchText.trim()
    ? reasons.filter((item) =>
        item.toLowerCase().includes(searchText.trim().toLowerCase())
      )
    : reasons;

  const handleMarkDone = async () => {
    try {
      setMarkDoneLoading(true);

      console.log("Task Done!");
    } catch (error) {
      console.error("This IS mark as done Error: ", error);
      toast.error(error?.response?.data?.message || "Internal Server Error.");
    } finally {
      setMarkDoneLoading(false);
    }
  };

  const columns = [
    { field: "cardNumber", headerName: "Card Number", flex: 1 },
    { field: "category", headerName: "Category", flex: 1 },
    {
      field: "amount",
      headerName: "Amount",
      flex: 1,
      renderCell: (params) => {
        const total = params.row.amount?.reduce(
          (sum, item) => sum + (item.Amount || 0),
          0
        );
        return `ETB ${total}`;
      },
    },
    { field: "status", headerName: "Status", flex: 1 },
    { field: "date", headerName: "Date", flex: 1 },
    {
      field: "Action",
      headerName: "Action",
      flex: 1,
      renderCell: () => {
        return (
          <Button
            variant="outlined"
            color="success"
            startIcon={<TaskAltIcon />}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              "&:hover": { transform: "scale(1.05)" },
            }}
            onClick={() => handleMarkDone()}
          >
            {markDoneLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Mark as Completed"
            )}
          </Button>
        );
      },
    },
  ];

  const handleChange = (e) => {
    if (e.target.name === "cardNumber") {
      mrnCheck(e.target.name, e.target.value);
    }
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const mrnCheck = (name, value) => {
    const comp = /^[0-9]{5,}$/;
    if (!comp.test(value) && value.length > 0) {
      setFormDataError((prev) => ({
        ...prev,
        [name]: "Please Insert Valid MRN, more than 5 digit only.",
      }));
    } else {
      setFormDataError((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const onlyLetterCheck = (name, value) => {
    const comp = /^[A-Za-z\s]+$/;
    if (!comp.test(value) && value.length > 0) {
      setFormDataError((prev) => ({
        ...prev,
        [name]: "Please Insert Only Letters.",
      }));
    } else {
      setFormDataError((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Patient Treatment Entry
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Card Number"
              name="cardNumber"
              value={formData?.cardNumber}
              onChange={handleChange}
              placeholder="Enter card number"
              error={!!formDataError?.cardNumber}
              helperText={formDataError?.cardNumber}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Treatment Category"
              name="category"
              value={formData?.category}
              onChange={handleChange}
            >
              {treatmentCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl
              // sx={{ m: 1, width: "100%", padding: 0 }}
              sx={{
                width: "100%",
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",

                  "&:hover fieldset": {
                    borderColor: "info.main",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main", // Focus effect
                    boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                  },
                },
              }}
            >
              <InputLabel id="demo-multiple-checkbox-label">
                {language === "AMH" ? "ምክንያት" : "Select Treatment*"}
              </InputLabel>

              <Select
                labelId="demo-multiple-checkbox-label"
                id="demo-multiple-checkbox"
                multiple
                fullWidth
                value={formData.reason}
                onChange={handleCheckboxChange}
                input={
                  <OutlinedInput
                    label={language === "AMH" ? "ምክንያት" : "Select Reason*"}
                  />
                }
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        onMouseDown={(e) => e.stopPropagation()} //Prevent Select toggle
                        onDelete={(e) => {
                          e.stopPropagation(); //Prevent Select toggle

                          setFormData((prev) => {
                            const current = prev.reason;
                            const updatedReason = current.filter(
                              (val) => !val.includes(value)
                            );
                            return {
                              ...prev,
                              reason: updatedReason,
                              amount: prev.amount.filter(
                                (item) => item.purpose !== value
                              ),
                            };
                          });
                        }}
                      />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {/* 🔍 Search bar inside the dropdown */}
                <ListSubheader>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search…"
                    value={searchText}
                    onChange={handleSearchChange}
                    /* Prevent *all* key events from bubbling up to <Select> */
                    inputProps={{
                      onKeyDown: (e) => e.stopPropagation(),
                      onKeyUp: (e) => e.stopPropagation(),
                      onKeyPress: (e) => e.stopPropagation(),
                    }}
                  />
                </ListSubheader>

                {filteredReason.map((reason) => (
                  <MenuItem key={reason} value={reason}>
                    <Checkbox checked={formData?.reason?.includes(reason)} />
                    <ListItemText primary={reason} />
                  </MenuItem>
                ))}

                {filteredReason.length === 0 && (
                  <MenuItem disabled>No results found</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={
                !formData?.cardNumber ||
                !formData?.category ||
                !formData?.reason?.length > 0
              }
            >
              {saveLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Save Treatment"
              )}
            </Button>
            <Button
              variant="outlined"
              color="error"
              sx={{ marginInline: "15px" }}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom fontWeight="bold">
        Treatment List
      </Typography>

      <Box mb={3} p={2} component={Paper} elevation={3} borderRadius={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              label="Search by Card Number"
              variant="outlined"
              fullWidth
              name="cardNumberSearch"
              value={cardNumberSearch}
              onChange={(e) => {
                mrnCheck("cardNumberSearch", e.target.value);
                setCardNumberSearch(e.target.value);
              }}
              InputLabelProps={{ shrink: true }}
              error={!!formDataError?.cardNumberSearch}
              helperText={formDataError?.cardNumberSearch}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField
              label="Search by Full Name"
              variant="outlined"
              fullWidth
              name="fullNameSearch"
              value={fullNameSearch}
              onChange={(e) => {
                onlyLetterCheck("fullNameSearch", e.target.value);
                setFullNameSearch(e.target.value);
              }}
              InputLabelProps={{ shrink: true }}
              error={!!formDataError?.fullNameSearch}
              helperText={formDataError?.fullNameSearch}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              size="large"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              sx={{
                height: "100%",
                borderRadius: 2,
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              {searchLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Search"
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Paper elevation={2} sx={{ height: 400 }}>
        <DataGrid
          rows={
            cardNumberSearch.length > 0 || fullNameSearch.length > 0
              ? filteredList
              : treatmentList
          }
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10]}
          disableSelectionOnClick
        />
      </Paper>
      <ToastContainer />
    </Box>
  );
};

export default TreatmentEntry;
