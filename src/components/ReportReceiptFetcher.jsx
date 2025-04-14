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
  Paper,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import api from "../utils/api";
import { getTokenValue } from "../services/user_service";
import { jsPDF } from "jspdf";
import numberToWords from "number-to-words";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const capitalizeWords = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
};

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

  const ReceiptRegex = /^[TS]+_[A-Z]+\-[a-zA-Z0-9]+$/;

  const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "createdOn", headerName: "Date", width: 200 },
    { field: "refNo", headerName: "Reciept Number", width: 200 },
    { field: "cardNumber", headerName: "Card Number", width: 150 },
    { field: "amount", headerName: "Amount", width: 120 },
    {
      field: "type",
      headerName: "Payment Method",
      width: 120,
    },
    { field: "purpose", headerName: "Reason", width: 190 },
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

  // To Display print iframe
  const printPDF = (doc) => {
    const blob = doc.output("blob");
    const blobURL = URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.style.display = "none"; // Hide the iframe
    iframe.src = blobURL;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobURL);
      }, 1000);
    };
  };

  //Generate PDF
  const generatePDF = (data, refNo) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a6",
      });

      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;

      const marginLeft = 10;
      const marginRight = pageWidth - 10;
      const maxWidth = pageWidth - marginLeft * 2;
      const baseFontSize = 10;
      const baseLineHeight = 6;

      // Estimate how many lines will be printed
      const countLines = () => {
        let lines = 10; // header and static
        lines += 5; // patient + method
        if (data.method.toUpperCase().includes("DIGITAL")) lines += 2;
        if (data.method.toUpperCase().includes("CBHI")) lines += 1;
        if (data.method.toUpperCase().includes("CREDIT")) lines += 1;
        lines += 3 + data.amount.length; // items and total
        lines += 6; // footer
        return lines;
      };

      const totalLines = countLines();
      let lineHeight = baseLineHeight;
      let fontSize = baseFontSize;

      const estimatedContentHeight = totalLines * baseLineHeight;

      if (estimatedContentHeight > pageHeight) {
        const scale = pageHeight / estimatedContentHeight;
        lineHeight = baseLineHeight * scale;
        fontSize = baseFontSize * scale;
      }

      let yPos = 8;
      doc.setFontSize(fontSize);

      const drawText = (text, x, y, options = {}) => {
        doc.text(String(text), x, y, options);
      };

      // Header
      doc.setFont("helvetica", "bold");
      drawText("*************************", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += lineHeight;
      drawText("HOSPITAL PAYMENT RECEIPT", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += lineHeight;
      drawText("*************************", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += lineHeight + 1;

      doc.setFontSize(fontSize - 1);
      drawText(`${tokenvalue?.Hospital || "N/A"}`, pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += lineHeight;

      // Receipt Info
      doc.setFont("helvetica", "normal");
      drawText(`Receipt NO: ${refNo || "N/A"}`, marginLeft, yPos);
      yPos += lineHeight;
      drawText(`Address: Debre Brihan`, marginLeft, yPos);
      yPos += lineHeight;
      drawText(`Date: ${new Date().toLocaleDateString()}`, marginLeft, yPos);
      yPos += lineHeight;
      drawText(`Cashier: ${tokenvalue?.name || "N/A"}`, marginLeft, yPos);
      yPos += lineHeight;

      doc.setLineWidth(0.3);
      doc.line(marginLeft, yPos, marginRight, yPos);
      yPos += lineHeight;

      // Patient Info
      doc.setFont("helvetica", "bold");
      drawText(`Patient Name:`, marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      drawText(`${data?.patientName || "N/A"}`, marginLeft + 35, yPos);
      yPos += lineHeight;

      doc.setFont("helvetica", "bold");
      drawText(`Card Number:`, marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      drawText(`${data.cardNumber || "N/A"}`, marginLeft + 35, yPos);
      yPos += lineHeight;

      doc.setFont("helvetica", "bold");
      drawText(`Payment Method:`, marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      drawText(`${data.method || "N/A"}`, marginLeft + 35, yPos);
      yPos += lineHeight;

      if (data.method.toUpperCase().includes("DIGITAL")) {
        doc.setFont("helvetica", "bold");
        drawText("Channel:", marginLeft, yPos);
        doc.setFont("helvetica", "normal");
        drawText(`${data.digitalChannel || "N/A"}`, marginLeft + 35, yPos);
        yPos += lineHeight;

        doc.setFont("helvetica", "bold");
        drawText("Transaction Ref No:", marginLeft, yPos);
        doc.setFont("helvetica", "normal");
        drawText(`${data.trxref || "N/A"}`, marginLeft + 35, yPos);
        yPos += lineHeight;
      } else if (data.method.toUpperCase().includes("CBHI")) {
        doc.setFont("helvetica", "bold");
        drawText(`Woreda:`, marginLeft, yPos);
        doc.setFont("helvetica", "normal");
        drawText(`${data.woreda || "N/A"}`, marginLeft + 35, yPos);
        yPos += lineHeight;
      } else if (data.method.toUpperCase().includes("CREDIT")) {
        doc.setFont("helvetica", "bold");
        drawText(`Organization:`, marginLeft, yPos);
        doc.setFont("helvetica", "normal");
        drawText(`${data.organization || "N/A"}`, marginLeft + 35, yPos);
        yPos += lineHeight;
      }

      doc.line(marginLeft, yPos, marginRight, yPos);
      yPos += lineHeight;

      // Item Table
      doc.setFont("helvetica", "bold");
      drawText(`Reason`, marginLeft, yPos);
      drawText(`Price`, marginRight - 25, yPos);
      yPos += lineHeight;

      doc.setFont("helvetica", "normal");
      data?.amount?.forEach((item) => {
        drawText(`${item.purpose}`, marginLeft, yPos);
        drawText(
          `${formatAccounting2(parseFloat(item.Amount).toFixed(2))}`,
          marginRight - 25,
          yPos
        );
        yPos += lineHeight;
      });

      doc.line(marginLeft, yPos, marginRight, yPos);
      yPos += lineHeight;

      const totalAmount = data?.amount
        ?.map((item) => parseFloat(item.Amount))
        .reduce((a, b) => a + b, 0);

      doc.setFont("helvetica", "bold");
      drawText(`Total In Figure`, marginLeft, yPos);
      drawText(
        `${formatAccounting2(totalAmount.toFixed(2))}`,
        marginRight - 25,
        yPos
      );
      yPos += lineHeight;

      drawText(`Total In Words : `, marginLeft, yPos);
      drawText(
        `${capitalizeWords(
          numberToWords.toWords(totalAmount.toFixed(2))
        )} birr`,
        marginLeft + 30,
        yPos,
        {
          maxWidth: maxWidth - 30, // to fit within the page
          align: "left",
        }
      );
      yPos += lineHeight * 2;

      doc.setFont("helvetica", "normal");
      drawText(
        "This Receipt is invalid unless it is stamped.",
        pageWidth / 2,
        yPos,
        { align: "center" }
      );

      // Save & Print
      doc.save("receipt.pdf");
      printPDF(doc);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handlePrint = () => {
    try {
      if (tab === 0 && cardNumber) {
        if (reportData.length > 0) {
          exportToExcel(
            reportData.map(({ id, isCollected, collectionID, ...rest }) => rest)
          );
        } else {
          toast.error("Data is Empty.");
        }
      } else if (tab === 1 && receiptNumber) {
        if (receiptData.length > 0) {
          const data = transformPayments(receiptData || []);
          generatePDF(data, receiptNumber);
        } else {
          toast.error("Data is Empty.");
        }
      }
    } catch (error) {
      console.error("Printing Task Erro: ", error);
    }
  };

  const transformPayments = (data) => {
    if (!data || data.length === 0) return null;

    const first = data[0]; // assume same cardNumber, type, etc.

    const result = {
      id: first.id, // or generate new one
      cardNumber: first.cardNumber,
      amount: data.map((item) => ({
        purpose: item.purpose,
        Amount: item.amount,
      })),
      method: first.type || "",
      description: "",
      reason: data.map((item) => item.purpose).join(", "),
      digitalChannel: "",
      woreda: "",
      trxref: "",
      organization: "",
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
                  refNo:refNo,
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
          setReceiptData(response2?.data);
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
    <Card sx={{ p: 3, borderRadius: "2xl", boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {tab === 0
            ? "Find Patient By Card Number"
            : "Generate Receipt by Receipt Number"}
        </Typography>

        <Tabs
          value={tab}
          onChange={(e, val) => {
            setTab(val);
          }}
          sx={{ mb: 2 }}
        >
          <Tab icon={<CreditCardIcon />} label="Report by Card Number" />
          <Tab icon={<ReceiptLongIcon />} label="Receipt" />
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
          pageSize={5}
          disableRowSelectionOnClick
          sx={{ backgroundColor: "#fff", borderRadius: 2 }}
        />
      </CardContent>
      <ToastContainer />
    </Card>
  );
};
export default ReportReceiptFetcher;
