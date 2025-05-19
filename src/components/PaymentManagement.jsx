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
  InputAdornment,
  IconButton,
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

const dummyData = [
  {
    id: 1,
    name: "John Doe",
    cardNumber: "12345",
    amount: 500,
    method: "",
    status: "Pending",
  },
  {
    id: 2,
    name: "Jane Smith",
    cardNumber: "67890",
    amount: 300,
    method: "",
    status: "Pending",
  },
];

const icons = {
  Cash: <LocalAtmIcon />,
  CBHI: <VolunteerActivismIcon />,
  Credit: <CreditScoreIcon />,
  "Free of Charge": <MonetizationOnIcon />,
  Digital: <AttachMoneyIcon />,
};

const creditOrganizations = ["Tsedey Bank", "Amhara Bank", "Ethio Telecom"]; // example list
const initialState = {
  cbhiID: "",
  method: "",
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
  const [formDataError, setFormDataError] = useState(initialState);

  const navigate = useNavigate();

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
    setSelectedRow(row);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData(initialState);
    setSelectedRow(null);
  };

  const handleSave = () => {
    if (
      formData?.method === "CBHI" &&
      (formData?.cbhiID.length <= 0 || formDataError?.cbhiID.length > 0)
    ) {
      return window.alert("Please Fill All Fields");
    }
    const updatedRows = rows.map((r) =>
      r.id === selectedRow.id
        ? {
            ...r,
            method: formData?.method,
            status: "Completed",
            payerId: formData?.cbhiID,
            transactionRef: formData?.trxref,
            creditOrg: formData?.organization,
          }
        : r
    );
    setRows(updatedRows);
    handleCloseModal();
  };

  const columns = [
    { field: "cardNumber", headerName: "Card Number", flex: 1 },
    { field: "name", headerName: "Patient Name", flex: 1 },
    { field: "amount", headerName: "Amount", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
    {
      field: "action",
      headerName: "Manage",
      renderCell: (params) => (
        <Button variant="contained" onClick={() => handleOpenModal(params.row)}>
          Manage
        </Button>
      ),
      flex: 1,
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

  const { totals, total } = getSummary();

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
                  {amt} Birr
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
              Total Received Today: {total} Birr
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
            startIcon={<AttachMoneyIcon />}
            onClick={() => navigate("/payments")}
          >
            Add Payment
          </Button>
        </Grid>
        <Grid item xs={12}>
          <DataGrid
            rows={rows.filter((r) => r.status === "Pending")}
            columns={columns}
            autoHeight
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
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
            Patient: <strong>{selectedRow?.name}</strong>
          </Typography>
          <Typography variant="body2" mb={2} color="text.secondary">
            Amount to Pay: <strong>{selectedRow?.amount} Birr</strong>
          </Typography>

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
              name="cbhiID"
              value={formData?.cbhiID}
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
    </Box>
  );
}

export default PaymentManagement;
