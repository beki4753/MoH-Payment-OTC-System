import React, { useState, useEffect } from "react";
import {
  Tabs,
  Tab,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
} from "@mui/material";
import api from "../../utils/api";
import { DataGrid } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import {
  GetAllPaymentByDate,
  GetAllPaymentType,
} from "../../services/report_service";
import { getTokenValue } from "../../services/user_service";
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import { formatAccounting2 } from "../hospitalpayment/HospitalPayment";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ReportPage = () => {
  const [payments, setPayments] = useState([]);

  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredPayments, setFilteredPayments] = useState(payments);
  const [paymentMethods, setpaymentMethods] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    woreda: "",
    organization: "",
  });

  const tokenValue = getTokenValue();

  //Fetch (CBHI) providers
  useEffect(() => {
    const fetchCBHI = async () => {
      try {
        const response = await api.get(
          `/Providers/list-providers/${tokenValue.name}`
        );
        if (response?.status === 200) {
          setWoredas(response?.data?.map((item) => item.provider));
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchCBHI();
  }, []);

  //Fetch Organization with agreement
  useEffect(() => {
    const fetchORG = async () => {
      try {
        const response = await api.get(
          `/Organiztion/Organization/${tokenValue.name}`
        );
        if (response?.status === 200 || response?.status === 201) {
          setOrganizations(response?.data?.map((item) => item.organization));
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchORG();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setpaymentMethods(await GetAllPaymentType());
    };

    fetchData();
  }, []);

  useEffect(() => {
    try {
      const newSet = new Set(payments.map((item) => item.type));
      const prev = new Set(paymentMethods.map((item) => item.type));
      const diffSet = new Set([...newSet].filter((x) => !prev.has(x)));

      if (diffSet.size === 0) return;

      const maxId =
        paymentMethods.length > 0
          ? Math.max(...paymentMethods.map((item) => item.id))
          : 0;

      const newEntries = Array.from(diffSet).map((type, index) => ({
        id: maxId + index + 1,
        type,
      }));

      setpaymentMethods((prevData) => [...prevData, ...newEntries]);
    } catch (error) {
      console.error("Filter Error : ", error);
    }
  }, [payments]);

  const exportToExcel = () => {
    const filtered = filteredPayments.map(
      ({ id, collectionID, createdOn, ...rest }) => {
        return { ...rest, createdOn: createdOn.split("T")[0] };
      }
    );
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments Report");
    XLSX.writeFile(
      wb,
      `Payments_Report_${startDate}_to_${endDate}_${selectedMethod}.xlsx`
    );
  };

  const cumulativeReport = () => {
    try {
      if (filteredPayments.length < 0) {
        toast.info("Empty Data.");
        return;
      }
      const modified = filteredPayments.map(
        ({ refNo, id, collectionID, createdOn, isCollected, ...rest }) => {
          return { ...rest, createdOn: createdOn.split("T")[0] };
        }
      );

      const grouped = modified.reduce((acc, item) => {
        // Create a group key from all keys except 'amount'
        const { amount, purpose, ...rest } = item;
        const key = JSON.stringify(rest); // serialize grouping keys

        if (!acc[key]) {
          acc[key] = { ...rest, amount: 0, purpose: [] };
        }

        acc[key].amount += amount;
        acc[key].purpose.push(purpose);
        return acc;
      }, {});

      const result = Object.values(grouped);
      const resultAmended = result.map(({ purpose, ...rest }) => {
        return { ...rest, purpose: purpose.join(",") };
      });
      const ws = XLSX.utils.json_to_sheet(resultAmended);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payments Report");
      XLSX.writeFile(
        wb,
        `Payments_Report_${startDate}_to_${endDate}_${selectedMethod}.xlsx`
      );
    } catch (error) {
      console.error(error);
      toast.error("Report Generation Failed.");
    }
  };

  

  const StyledGridOverlay = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    "& .no-results-primary": {
      fill: "#3D4751",
      ...theme.applyStyles("light", {
        fill: "#AEB8C2",
      }),
    },
    "& .no-results-secondary": {
      fill: "#1D2126",
      ...theme.applyStyles("light", {
        fill: "#E8EAED",
      }),
    },
  }));

  function CustomNoResultsOverlay() {
    return (
      <StyledGridOverlay>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          width={96}
          viewBox="0 0 523 299"
          aria-hidden
          focusable="false"
        >
          <path
            className="no-results-primary"
            d="M262 20c-63.513 0-115 51.487-115 115s51.487 115 115 115 115-51.487 115-115S325.513 20 262 20ZM127 135C127 60.442 187.442 0 262 0c74.558 0 135 60.442 135 135 0 74.558-60.442 135-135 135-74.558 0-135-60.442-135-135Z"
          />
          <path
            className="no-results-primary"
            d="M348.929 224.929c3.905-3.905 10.237-3.905 14.142 0l56.569 56.568c3.905 3.906 3.905 10.237 0 14.143-3.906 3.905-10.237 3.905-14.143 0l-56.568-56.569c-3.905-3.905-3.905-10.237 0-14.142ZM212.929 85.929c3.905-3.905 10.237-3.905 14.142 0l84.853 84.853c3.905 3.905 3.905 10.237 0 14.142-3.905 3.905-10.237 3.905-14.142 0l-84.853-84.853c-3.905-3.905-3.905-10.237 0-14.142Z"
          />
          <path
            className="no-results-primary"
            d="M212.929 185.071c-3.905-3.905-3.905-10.237 0-14.142l84.853-84.853c3.905-3.905 10.237-3.905 14.142 0 3.905 3.905 3.905 10.237 0 14.142l-84.853 84.853c-3.905 3.905-10.237 3.905-14.142 0Z"
          />
          <path
            className="no-results-secondary"
            d="M0 43c0-5.523 4.477-10 10-10h100c5.523 0 10 4.477 10 10s-4.477 10-10 10H10C4.477 53 0 48.523 0 43ZM0 89c0-5.523 4.477-10 10-10h80c5.523 0 10 4.477 10 10s-4.477 10-10 10H10C4.477 99 0 94.523 0 89ZM0 135c0-5.523 4.477-10 10-10h74c5.523 0 10 4.477 10 10s-4.477 10-10 10H10c-5.523 0-10-4.477-10-10ZM0 181c0-5.523 4.477-10 10-10h80c5.523 0 10 4.477 10 10s-4.477 10-10 10H10c-5.523 0-10-4.477-10-10ZM0 227c0-5.523 4.477-10 10-10h100c5.523 0 10 4.477 10 10s-4.477 10-10 10H10c-5.523 0-10-4.477-10-10ZM523 227c0 5.523-4.477 10-10 10H413c-5.523 0-10-4.477-10-10s4.477-10 10-10h100c5.523 0 10 4.477 10 10ZM523 181c0 5.523-4.477 10-10 10h-80c-5.523 0-10-4.477-10-10s4.477-10 10-10h80c5.523 0 10 4.477 10 10ZM523 135c0 5.523-4.477 10-10 10h-74c-5.523 0-10-4.477-10-10s4.477-10 10-10h74c5.523 0 10 4.477 10 10ZM523 89c0 5.523-4.477 10-10 10h-80c-5.523 0-10-4.477-10-10s4.477-10 10-10h80c5.523 0 10 4.477 10 10ZM523 43c0 5.523-4.477 10-10 10H413c-5.523 0-10-4.477-10-10s4.477-10 10-10h100c5.523 0 10 4.477 10 10Z"
          />
        </svg>
        <Box sx={{ mt: 2 }}>No results found.</Box>
      </StyledGridOverlay>
    );
  }

  useEffect(() => {
    if (formData?.organization?.length <= 0 && formData.woreda?.length <= 0) {
      setFilteredPayments(
        payments
          ? payments.filter((payment) =>
              selectedMethod === "ALL"
                ? payment
                : payment.type === selectedMethod
            )
          : []
      );
    }
  }, [selectedMethod, startDate, endDate, payments]);

  const handleMethodChange = (event, newValue) => {
    setSelectedMethod(newValue);
    setFormData({
      woreda: "",
      organization: "",
    });
  };

  const calculateTotal = (method) => {
    try {
      return payments
        ? payments
            .filter((payment) =>
              method === "ALL" ? payment : payment.type === method
            )
            .reduce((sum, payment) => sum + Number(payment.amount), 0)
        : 0; // Ensure amount is treated as a number
    } catch (error) {
      console.error("Calc Error : ", error);
    }
  };

  const columns = [
    { field: "refNo", headerName: "Ref No.", width: 200 },
    { field: "hospitalName", headerName: "Hospital Name", width: 150 },
    { field: "cardNumber", headerName: "Card Number", width: 150 },
    { field: "purpose", headerName: "Service", width: 150 },
    {
      field: "amount",
      headerName: "Amount",
      width: 120,
      renderCell: (params) => formatAccounting2(params.row.amount),
    },
    { field: "type", headerName: "Payment Method", width: 150 },
    { field: "description", headerName: "Description", width: 200 },
    { field: "createdOn", headerName: "Date", width: 150 },
    { field: "createdby", headerName: "Created by", width: 150 },
  ];

  const handleReportRequest = async () => {
    try {
      if (startDate === "" || endDate === "") {
        alert("Please select start and end date");
        return;
      }

      const datas = await GetAllPaymentByDate({
        startDate,
        endDate,
        user: tokenValue.name,
      });

      if (datas.length > 0) {
        setPayments(datas);

        setFilteredPayments(
          payments
            ? payments.filter((payment) =>
                selectedMethod === "ALL"
                  ? payment
                  : payment.type === selectedMethod
              )
            : []
        );
      }

      setPayments(datas);

      setFilteredPayments(
        payments
          ? payments.filter((payment) =>
              selectedMethod === "All"
                ? payment
                : payment.type === selectedMethod
            )
          : []
      );
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const filterData = (name, value) => {
    try {
      if (name === "woreda") {
        if (payments.length <= 0) {
          toast.info("Empty Filter.");
          return;
        }
        const copy = payments;
        setFilteredPayments(
          copy?.filter(
            (item) => item.patientLoaction.toLowerCase() === value.toLowerCase()
          )
        );
      } else if (name === "organization") {
        const copy = payments;
        setFilteredPayments(
          copy?.filter(
            (item) =>
              item.patientWorkingPlace.toLowerCase() === value.toLowerCase()
          )
        );
      }
    } catch (error) {
      console.error("The Data Filter Error", error);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === "woreda") {
      setSelectedMethod("CBHI");
      setFormData({ organization: "", [e.target.name]: e.target.value });
    } else {
      setSelectedMethod("Credit");
      setFormData({ woreda: "", [e.target.name]: e.target.value });
    }
    filterData(e.target.name, e.target.value);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ margin: 2 }}>
        Payment Reports
      </Typography>
      <Paper sx={{ padding: 2, margin: 2 }}>
        <Grid container spacing={1}>
          <Grid item xs={2}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setFormData({
                  woreda: "",
                  organization: "",
                });
              }}
              InputLabelProps={{ shrink: true }}
              required
              sx={{ marginRight: 2 }}
            />
          </Grid>

          <Grid item xs={2}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setFormData({
                  woreda: "",
                  organization: "",
                });
              }}
              InputLabelProps={{ shrink: true }}
              required
              sx={{ marginRight: 2 }}
            />
          </Grid>
          <Grid item xs={2}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleReportRequest}
              sx={{ marginRight: 2 }}
            >
              Request Report
            </Button>
          </Grid>

          <Grid item xs={3}>
            <TextField
              select
              fullWidth
              label="Woreda"
              name="woreda"
              value={formData.woreda}
              onChange={handleChange}
            >
              {woredas.map((woreda) => (
                <MenuItem key={woreda} value={woreda}>
                  {woreda}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={3}>
            <TextField
              select
              fullWidth
              label="Organization"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
            >
              {organizations.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        <Tabs
          value={selectedMethod}
          onChange={handleMethodChange}
          variant="scrollable"
          sx={{ marginTop: 2 }}
        >
          {paymentMethods.length > 0 &&
            paymentMethods.map((method) => (
              <Tab
                key={method.type}
                label={`${method.type} (${calculateTotal(method.type)})`}
                value={method.type}
              />
            ))}
        </Tabs>
      </Paper>
      <Paper sx={{ height: 400, margin: 2 }}>
        <DataGrid
          rows={filteredPayments.length ? filteredPayments : []}
          columns={columns}
          slots={{
            noResultsOverlay: CustomNoResultsOverlay,
          }}
        />
      </Paper>
      <Button
        sx={{ marginLeft: 2 }}
        variant="contained"
        color="primary"
        onClick={() => exportToExcel()}
      >
        Export to Excel
      </Button>
      <Button
        sx={{ marginLeft: 2 }}
        variant="contained"
        color="primary"
        onClick={() => cumulativeReport()}
      >
        Cumulative Export
      </Button>

      <ToastContainer />
    </Box>
  );
};

export default ReportPage;
