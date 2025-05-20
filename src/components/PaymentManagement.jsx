import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  Modal,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Card,
  CardContent,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Checkbox,
  Avatar,
} from "@mui/material";
import { PDFDocument, rgb } from "pdf-lib";
import ReactDOM from "react-dom/client";
import RenderPDF from "../pages/hospitalpayment/RenderPDF";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import PaidIcon from "@mui/icons-material/Paid";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import PaymentIcon from "@mui/icons-material/Payment";
import api from "../utils/api";
import { getTokenValue } from "../services/user_service";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatAccounting2 } from "../pages/hospitalpayment/HospitalPayment";

const tokenvalue = getTokenValue();

const dummyData = [
  {
    patientCardNumber: "000000002",

    patientFirstName: "string1",

    patientMiddleName: "string2",

    patientLastName: "string3",

    patientMotherName: null,

    patientAge: 20,

    patientGender: "Male",

    requestGroup: null,

    noRequestedServices: 2,

    rquestedServices: ["Card/ካርድ [100.00] ", "Medicne/መድሃኒት [100.00] "],

    requestedCatagories: [
      {
        groupID: "casheir-d2bf74cb-09ab-402d-9d86-dfced2e6ebac",

        amount: 100.0,

        purpose: "Laboratory",
      },

      {
        groupID: "casheir-d2bf74cb-09ab-402d-9d86-dfced2e6ebac",

        amount: 100.0,

        purpose: "X-Ray/Ultrasound",
      },
    ],

    totalPrice: 200.0,

    requestedReason: null,

    paid: false,

    isCompleted: false,

    requestedBy: "test1",

    createdOn: "2025-05-19T00:00:00",
  },
];

const icons = {
  Cash: <LocalAtmIcon />,
  CBHI: <VolunteerActivismIcon />,
  Credit: <CreditScoreIcon />,
  "Free of Charge": <MonetizationOnIcon />,
  Digital: <AttachMoneyIcon />,
};

//const creditOrganizations = ["Tsedey Bank", "Amhara Bank", "Ethio Telecom"]; // example list
const initialState = {
  cbhiId: "",
  method: "",
  reason: "",
  amount: "",
  digitalChannel: "",
  trxref: "",
  organization: "",
  employeeId: "",
};
function PaymentManagement() {
  const [rows, setRows] = useState(dummyData);
  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [digitalChannels, setDigitalChannels] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [creditOrganizations, setcreditOrganizations] = useState([]);
  const [totals, setTotals] = useState({});
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  //Fetch Organization with agreement
  useEffect(() => {
    const fetchORG = async () => {
      try {
        const response = await api.get(
          `/Organiztion/Organization/${tokenvalue.name}`
        );
        if (response?.status === 200 || response?.status === 201) {
          setcreditOrganizations(
            response?.data?.map((item) => item.organization)
          );
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchORG();
  }, []);

  //All Payments by casher
  useEffect(() => {
    const fetchPaymetInfo = async () => {
      try {
        const response = await api.put(
          "/Payment/payment-by-cashier",
          tokenvalue.name,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (response.status === 200) {
          const sortedPayment = await response?.data.sort(
            (a, b) => b.id - a.id
          );
          updatePaymentSummary(sortedPayment);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchPaymetInfo();
  }, []);

  const updatePaymentSummary = (payments) => {
    const summary = payments.reduce((acc, payment) => {
      const { type, amount } = payment;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += parseFloat(amount);
      return acc;
    }, {});

    setTotals(summary);
    setTotal(Object.values(summary).reduce((a, b) => a + b, 0));
  };

  // Fetch Payment Options
  useEffect(() => {
    const fetchMeth = async () => {
      try {
        const response = await api.get("/Lookup/payment-type");
        if (response?.status === 200) {
          setPaymentOptions(
            response?.data
              ?.filter((item) => item.type !== "ALL")
              .map((item) => item.type)
          );
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchMeth();
  }, []);

  //fetch Digital Channels
  useEffect(() => {
    const fetchChane = async () => {
      try {
        const response = await api.get("/Lookup/payment-channel");
        if (response?.status === 200) {
          setDigitalChannels(response?.data?.map((item) => item.channel));
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchChane();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenModal = (row) => {
    try {
      const datavisualization = dummyData.filter(
        (item) => item?.patientCardNumber === row?.patientCardNumber
      );
      const modData = datavisualization.map(
        ({ requestedCatagories, ...rest }) => ({
          requestedCatagories: requestedCatagories.map((item) => ({
            ...item,
            isOk: true,
          })),
          ...rest,
        })
      );
      setSelectedRow(modData[0]);
      setOpenModal(true);
    } catch (error) {
      console.error("This is The Open Modal error: ", error);
      toast.error("Unable to open.");
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData(initialState);
    setSelectedRow(null);
  };

  const handleSave = async () => {
    if (
      !formData.method ||
      (formData.method.toUpperCase().includes("DIGITAL") &&
        (!formData.digitalChannel || !formData.trxref)) ||
      (formData.method.toUpperCase().includes("CBHI") && !formData.cbhiId) ||
      (formData.method.toUpperCase().includes("CREDIT") &&
        (!formData.organization || !formData.employeeId))
    ) {
      toast.error("Please Fill All Fields");
      return;
    }

    if (
      !selectedRow.requestedCatagories
        .map((item) => item.isOk)
        .some((item) => item === true)
    ) {
      toast.error("Should have at least one payment.");
      return;
    }
    const updatedRows = rows.map((r) =>
      r.id === selectedRow.id
        ? {
            ...r,
            method: formData?.method,
            status: "Completed",
            payerId: formData?.cbhiId,
            transactionRef: formData?.trxref,
            creditOrg: formData?.organization,
          }
        : r
    );
    setRows(updatedRows);
    handleCloseModal();
  };

  const columns = [
    { field: "patientCardNumber", headerName: "Card Number", flex: 1 },
    { field: "patientFirstName", headerName: "First Name", flex: 1 },
    { field: "patientMiddleName", headerName: "Father Name", flex: 1 },
    { field: "patientLastName", headerName: "Grand Father Name", flex: 1 },
    { field: "patientGender", headerName: "Gender", flex: 1 },
    { field: "noRequestedServices", headerName: "Requested Services", flex: 1 },
    {
      field: "requestedCatagories",
      headerName: "Reason",
      flex: 1,
      renderCell: (params) => {
        return params.row.requestedCatagories
          .map((item) => item.purpose)
          .join(", ");
      },
    },
    {
      field: "totalPrice",
      headerName: "Amount",
      flex: 1,
      renderCell: (params) => {
        return formatAccounting2(params.row.totalPrice);
      },
    },
    {
      field: "paid",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => {
        return params.row.paid ? "Completed" : "Pending";
      },
    },
    {
      field: "createdOn",
      headerName: "Date",
      flex: 1,
      renderCell: (params) => {
        const date = new Date(params.row.createdOn);
        return date.toISOString().split("T")[0];
      },
    },
    {
      field: "action",
      headerName: "Manage",
      flex: 1,
      renderCell: (params) => (
        <Button variant="contained" onClick={() => handleOpenModal(params.row)}>
          Manage
        </Button>
      ),
    },
  ];

  const getSummary = () => {
    const totals = {};
    paymentOptions.forEach((method) => {
      totals[method] = 0;
    });

    rows.forEach((r) => {
      if (r.status === "Completed" && r.method) {
        if (!totals[r.method]) totals[r.method] = 0;
        totals[r.method] += r.amount;
      }
    });

    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    return { totals, total };
  };

  //const { totals, total } = getSummary();

  const openNewTab = (id) => {
    window.open(
      `https://cs.bankofabyssinia.com/slip/?trx=${id}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const generateAndOpenPDF = async (error) => {
    try {
      const responseData = error?.response?.data;

      // Check if response is a Blob (e.g., an actual PDF file)
      if (responseData instanceof Blob) {
        const blobUrl = URL.createObjectURL(responseData);
        window.open(blobUrl, "_blank");

        // Revoke the blob after a few seconds to free memory
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        return;
      }

      // If it's not a Blob, try to extract message
      let message = "Incorrect Receipt ID";
      if (responseData?.message) {
        message = String(responseData.message);
      }

      // Generate a simple PDF with the message using pdf-lib
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const { height } = page.getSize();

      page.drawText(message, {
        x: 50,
        y: height - 100,
        size: 16,
        color: rgb(0, 0, 0),
      });

      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);

      window.open(pdfUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000);
    } catch (err) {
      console.error("generateAndOpenPDF error:", err);
    }
  };

  const handleOpenPage = async () => {
    try {
      const receptId = formData?.trxref;

      let config = {};
      let url;
      if (
        formData.digitalChannel.toUpperCase().includes("CBE MOBILE BANKING") ||
        formData.digitalChannel.toUpperCase().includes("TELEBIRR")
      ) {
        url = `/Lookup/payment-verify/${receptId}?channel=${formData?.digitalChannel.toUpperCase()}`;
        if (
          formData.digitalChannel.toUpperCase().includes("CBE MOBILE BANKING")
        ) {
          config = { responseType: "blob" };
        } else {
          config = {};
        }
      } else if (
        formData.digitalChannel.toUpperCase().includes("BANK OF ABYSSINIA")
      ) {
        // url = `/Lookup/redirecttoboa?transactionId=${receptId}`;
        openNewTab(receptId);
        // <a href={`https://cs.bankofabyssinia.com/slip/?trx=${receptId}`} target="_blank">View Slip</a>
      }

      if (
        !formData.digitalChannel.toUpperCase().includes("BANK OF ABYSSINIA")
      ) {
        const response = await api.get(url, config);

        if (formData.digitalChannel.toUpperCase().includes("TELEBIRR")) {
          const newTab = window.open();
          if (newTab) {
            const newTabDocument = newTab.document;

            // Create a root div
            const rootDiv = newTabDocument.createElement("div");
            rootDiv.id = "root";
            newTabDocument.body.appendChild(rootDiv);

            // Render the component in the new tab
            const root = ReactDOM.createRoot(rootDiv);
            root.render(<RenderPDF html={response?.data} />);
          }
        } else if (
          formData.digitalChannel.toUpperCase().includes("CBE MOBILE BANKING")
        ) {
          try {
            const pdfBlob = response?.data
              ? new Blob([response?.data], {
                  type: "application/pdf",
                })
              : new Blob("Unknown status received.");

            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, "_blank");
          } catch (error) {
            console.error("CBE Error: ", error);
          }
        }
      }
    } catch (error) {
      console.error(error);
      if (
        formData.digitalChannel.toUpperCase().includes("CBE MOBILE BANKING")
      ) {
        await generateAndOpenPDF(error);
      }
    }
  };

  return (
    <Box p={3}>
      {/* 🔝 Summary */}
      <Typography variant="h5" gutterBottom>
        💰 Today's Payment Summary
      </Typography>
      <Grid container spacing={2} mb={3}>
        {Object.entries(totals).map(([method, amt]) => (
          <Grid item xs={12} sm={6} md={3} key={method}>
            <Card
              sx={{
                display: "flex",
                alignItems: "center",
                p: 2,
                boxShadow: 3,
                borderRadius: 3,
              }}
            >
              <Avatar sx={{ bgcolor: "#1976d2", mr: 2 }} variant="rounded">
                {icons[method] || <PaymentIcon />}
              </Avatar>
              <Box>
                <Typography variant="subtitle2">{method}</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatAccounting2(amt)} Birr
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              backgroundColor: "#e3f2fd",
              borderLeft: "5px solid #1976d2",
              borderRadius: 2,
              mt: 1,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Total Received Today: {formatAccounting2(total)} Birr
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 📋 Data Table */}
      <Grid container spacing={2} alignItems="center" mb={2}>
        <Grid item xs={8}>
          <Typography variant="h6">🕓 Pending Payments</Typography>
        </Grid>
        <Grid item xs={4} textAlign="right">
          <Button
            variant="contained"
            color="success"
            //startIcon={<AttachMoneyIcon />}
            onClick={() => navigate("/payments")}
          >
            Add Payment
          </Button>
        </Grid>
        <Grid item xs={12}>
          <DataGrid
            rows={rows}
            getRowId={(row) => row.patientCardNumber}
            columns={columns}
          />
        </Grid>
      </Grid>

      {/* 💳 Modal */}
      <Modal open={openModal} onClose={() => {}} disableEscapeKeyDown>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            bgcolor: "background.paper",
            p: 4,
            boxShadow: 10,
            borderRadius: 3,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            💳 Manage Payment
          </Typography>

          <Typography variant="body1" color="text.secondary" gutterBottom>
            Patient:{" "}
            <strong>
              {selectedRow?.patientFirstName +
                " " +
                selectedRow?.patientMiddleName +
                " " +
                selectedRow?.patientLastName}
            </strong>
          </Typography>
          <Typography variant="body2" mb={2} color="text.secondary">
            Amount to Pay:{" "}
            <strong>
              {selectedRow?.requestedCatagories
                .filter((item) => item.isOk)
                .reduce((sum, item) => sum + item.amount, 0)}
              Birr
            </strong>
          </Typography>
          {selectedRow?.requestedCatagories.map((item, index) => (
            <FormControlLabel
              key={item.purpose}
              control={
                <Checkbox
                  name={item.purpose}
                  checked={!!item.isOk}
                  onChange={(e) => {
                    const isChecked = e.target.checked;

                    // Create a copy and update the relevant item
                    const updatedCategories =
                      selectedRow.requestedCatagories.map((cat, i) =>
                        i === index ? { ...cat, isOk: isChecked } : cat
                      );

                    // Update selectedRow state
                    setSelectedRow((prev) => ({
                      ...prev,
                      requestedCatagories: updatedCategories,
                    }));
                  }}
                />
              }
              label={item.purpose}
            />
          ))}

          {/* Payment Method */}

          <FormControl fullWidth margin="dense">
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={formData?.method}
              name="method"
              label="Payment Method"
              onChange={handleChange}
              required
            >
              {paymentOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Digital Payment Fields */}
          {formData?.method === "Digital" && (
            <>
              <TextField
                select
                label="Digital Channel"
                name="digitalChannel"
                value={formData?.digitalChannel}
                onChange={handleChange}
                fullWidth
                margin="dense"
                required
              >
                {digitalChannels.map((channel) => (
                  <MenuItem key={channel} value={channel}>
                    {channel}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Transaction Reference No"
                name="trxref"
                value={formData?.trxref}
                onChange={handleChange}
                fullWidth
                required
                margin="dense"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleOpenPage} edge="end">
                        <OpenInNewIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </>
          )}

          {/* Credit Fields */}
          {formData?.method === "Credit" && (
            <>
              <FormControl fullWidth margin="dense">
                <InputLabel>Organization</InputLabel>
                <Select
                  value={formData?.organization}
                  name="organization"
                  label="Organization"
                  onChange={handleChange}
                  required
                >
                  {creditOrganizations.map((org) => (
                    <MenuItem key={org} value={org}>
                      {org}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                margin="dense"
                label="Employee ID"
                required
                name="employeeId"
                value={formData?.employeeId}
                onChange={handleChange}
              />
            </>
          )}

          {/* CBHI Field */}
          {formData?.method === "CBHI" && (
            <TextField
              fullWidth
              margin="dense"
              label="CBHI ID Number"
              name="cbhiId"
              value={formData?.cbhiId}
              onChange={handleChange}
              required
            />
          )}

          {/* Action Buttons */}
          <Grid container spacing={2} mt={3}>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSave}
                startIcon={<PaidIcon />}
              >
                Complete
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
      <ToastContainer />
    </Box>
  );
}

export default PaymentManagement;
