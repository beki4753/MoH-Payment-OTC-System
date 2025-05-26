import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import api from "../utils/api";
import { getTokenValue } from "../services/user_service";
import { generatePDF } from "../pages/hospitalpayment/HospitalPayment";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

const formatter2 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});

const formatAccounting2 = (num) => {
  const formatted = formatter2.format(Math.abs(num));
  return num < 0 ? `(${formatted})` : formatted;
};

const tokenvalue = getTokenValue();

const ReportReceiptFetcher = () => {
  const [tab, setTab] = useState(0);
  const [cardNumber, setCardNumber] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [receiptData, setReceiptData] = useState([]);
  const [errorM, setErrorM] = useState("");
  const [dispPrint, setDispPrint] = useState(false);

  const ReceiptRegex = /^[a-zA-Z0-9]+$/;

  const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "registeredOn", headerName: "Date", width: 200 },
    { field: "referenceNo", headerName: "Reciept Number", width: 200 },
    { field: "patientCardNumber", headerName: "Card Number", width: 150 },
    {
      field: "paymentAmount",
      headerName: "Amount",
      width: 120,
      renderCell: (params) => formatAccounting2(params.row.paymentAmount),
    },
    {
      field: "paymentType",
      headerName: "Payment Method",
      width: 120,
    },
    { field: "paymentReason", headerName: "Reason", width: 190 },
  ];

  const exportToExcel = (data) => {
    try {
      if (!data || data.length === 0) return;

      const { cardNumber, hospitalName, department, createdby } = data[0];

      // Seal-style header section (4 rows)
      const headerSection = [
        ["Card Number", cardNumber],
        ["Hospital Name", hospitalName],
        ["Department", department],
        ["Cashier", createdby],
        [], // <-- blank row
      ];

      // Extract data table (excluding repeating fields)
      const tableData = data.map(
        ({ cardNumber, hospitalName, department, createdby, ...rest }) => rest
      );

      // Create sheet from header
      const ws = XLSX.utils.aoa_to_sheet(headerSection);

      // Add table data after the blank row (origin: row 6 = index 5)
      XLSX.utils.sheet_add_json(ws, tableData, {
        origin: { r: headerSection.length, c: 0 },
        skipHeader: false,
      });

      // Optional styling for better visuals
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({
          r: headerSection.length,
          c: C,
        });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = {
          font: { bold: true },
          alignment: { horizontal: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }

      // Workbook creation
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Patient Report of ${cardNumber}`);
      XLSX.writeFile(
        wb,
        `Patient Report ${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Excel export failed:", error);
    }
  };

  const handlePrint = async () => {
    try {
      if (tab === 0 && cardNumber) {
        if (reportData.length > 0) {
          const excelData = await transformPayments(reportData);
          exportToExcel(
            excelData.map(({ id, isCollected, collectionID, ...rest }) => rest)
          );
        } else {
          toast.error("Data is Empty.");
        }
      } else if (tab === 1 && receiptNumber) {
        if (receiptData.length > 0) {
          const data = await transformPayments(receiptData || []);
          generatePDF(data);
        } else {
          toast.error("Data is Empty.");
        }
      }
    } catch (error) {
      console.error("Printing Task Erro: ", error);
    }
  };

  const transformPayments = async (data) => {
    if (!data || data.length === 0) return null;

    const first = data[0];

    const result = {
      refNo: first?.referenceNo,
      id: first?.id,
      cardNumber: first?.patientCardNumber,
      patientName: first?.patientName,
      hospitalName: first?.hospitalName,
      department: first?.department,
      amount: data.map((item) => ({
        purpose: item.paymentReason,
        amount: item.paymentAmount,
      })),
      cbhiId: first?.patientCBHI_ID,
      createdby: first?.registeredBy,
      method: first?.paymentType,
      digitalChannel: first?.paymentChannel,
      trxref: first?.paymentVerifingID,
      patientLoaction: first?.patientWoreda,
      organization: first?.patientWorkingPlace,
      employeeId: first?.patientWorkID,
      description: first?.paymentDescription,
      createdOn: first?.registeredOn,
    };

    return result;
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      if (tab === 0 && cardNumber) {
        const response = await api.put("/Payment/payment-by-cardNumber", {
          code: cardNumber,
          name: tokenvalue?.name,
        });
        if (response?.data?.length > 0) {
          setDispPrint(true);
          const mod = response?.data
            ? response?.data?.map(
                ({
                  channel,
                  createdOn,
                  refNo,
                  type,
                  description,
                  paymentVerifingID,
                  patientLoaction,
                  patientWorkingPlace,
                  patientWorkID,
                  ...rest
                }) => ({
                  refNo: refNo,
                  ...rest,
                  type: type,
                  channel: channel === "-" ? type : channel,
                  paymentVerifingID:
                    paymentVerifingID === "-" ? refNo : paymentVerifingID,
                  patientLoaction:
                    patientLoaction === "-" ? "Walking" : patientLoaction,
                  patientWorkingPlace:
                    patientWorkingPlace === "-"
                      ? "Walking"
                      : patientWorkingPlace,
                  patientWorkID:
                    patientWorkID === "-" ? "Walking" : patientWorkID,

                  description,
                  createdOn: createdOn,
                })
              )
            : [];

          setReportData(mod);
        } else if (response?.data?.length <= 0) {
          toast.info("Card Number Not Found.");
        }
      } else if (tab === 1 && receiptNumber) {
        const response2 = await api.put("/Payment/payment-by-refno", {
          paymentId: receiptNumber,
          user: tokenvalue?.name,
        });

        if (response2?.data?.length > 0) {
          setDispPrint(true);
          const modData = response2?.data?.map(({ rowId, ...rest }) => ({
            id: rowId,
            ...rest,
          }));
          setReceiptData(modData);
        } else if (response2?.data?.length <= 0) {
          toast.info("Receipt Not Found.");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data || "Internal Server Error.");
      setDispPrint(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCardNumber("");
    setReceiptNumber("");
    setDispPrint(false);
    setErrorM("");
    setReportData([]);
    setReceiptData([]);
  }, [tab]);

  const validateReceipt = (value) => {
    if (!ReceiptRegex.test(value) && value?.length > 0) {
      setErrorM("Please Insert Valid Receipt Number.");
    } else {
      setErrorM("");
    }
  };

  return (
    <Card
      sx={{ p: 3, borderRadius: "2xl", boxShadow: 3, marginInline: "15px" }}
    >
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {tab === 0
            ? "Find Patient By Card Number"
            : "Generate Receipt by Receipt Number"}
        </Typography>

        <Tabs
          value={tab}
          onChange={(e, val) => setTab(val)}
          sx={{ mb: 2 }}
          TabIndicatorProps={{
            style: { backgroundColor: "#1976d2" }, // underline color
          }}
        >
          <Tab
            icon={<CreditCardIcon />}
            label="Report by Card Number"
            sx={{
              "&.Mui-selected": {
                color: "#a2b9f5",
              },
            }}
          />
          <Tab
            icon={<ReceiptLongIcon />}
            label="Receipt"
            sx={{
              "&.Mui-selected": {
                color: "#a2b9f5",
              },
            }}
          />
        </Tabs>

        <Box display="flex" alignItems="center" gap={2} mb={3}>
          {tab === 0 ? (
            <TextField
              label="Card Number"
              variant="outlined"
              value={cardNumber}
              onChange={(e) => {
                setDispPrint(false);
                setReportData([]);
                setCardNumber(e.target.value);
              }}
              fullWidth
            />
          ) : (
            <TextField
              label="Receipt Number"
              variant="outlined"
              value={receiptNumber}
              onChange={(e) => {
                setReceiptData([]);
                setDispPrint(false);
                const val = e.target.value;
                validateReceipt(val);
                setReceiptNumber(val);
              }}
              fullWidth
              error={!!errorM}
              helperText={errorM}
            />
          )}

          {!dispPrint && (
            <Button
              variant="contained"
              size="large"
              onClick={() => handleSearch()}
              disabled={
                loading ||
                (tab === 0 ? !cardNumber : !receiptNumber) ||
                !!errorM
              }
            >
              {loading ? <CircularProgress size={24} /> : "Search"}
            </Button>
          )}

          {dispPrint && (
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => handlePrint()}
            >
              {loading ? <CircularProgress size={24} /> : "Print"}
            </Button>
          )}
        </Box>

        <DataGrid
          autoHeight
          rows={tab === 0 ? reportData : receiptData}
          columns={columns}
          disableRowSelectionOnClick
        />
      </CardContent>
      <ToastContainer />
    </Card>
  );
};
export default ReportReceiptFetcher;
