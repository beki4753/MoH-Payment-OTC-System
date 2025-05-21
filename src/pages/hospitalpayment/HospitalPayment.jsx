import React, { useState, useEffect } from "react";
import {
  Container,
  TextField,
  MenuItem,
  Button,
  Typography,
  Paper,
  FormControlLabel,
  Box,
  Checkbox,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { PDFDocument, rgb } from "pdf-lib";
import numberToWords from "number-to-words";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import ReactDOM from "react-dom/client";
import ReceiptModal from "./ReceiptModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getTokenValue } from "../../services/user_service";
import api from "../../utils/api";
import { useLang } from "../../contexts/LangContext";
import RenderPDF from "./RenderPDF";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { green, orange, grey } from "@mui/material/colors";

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

const tokenvalue = getTokenValue();

const formatter = new Intl.NumberFormat("en-us", {
  style: "currency",
  currency: "ETB",
  minimumFractionDigits: 2,
});

const formatter2 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});

export const formatAccounting2 = (num) => {
  const formatted = formatter2.format(Math.abs(num));
  return num < 0 ? `(${formatted})` : formatted;
};

export const formatAccounting = (num) => {
  const formatted = formatter.format(Math.abs(num));
  return num < 0 ? `(${formatted})` : formatted;
};

export const generateAndOpenPDF = async (error) => {
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

const initialState = {
  cardNumber: "",
  amount: [],
  method: "",
  description: "",
  reason: [],
  digitalChannel: "",
  cbhiId: "",
  trxref: "",
  organization: "",
  employeeId: "",
};

// To Display print iframe
export const printPDF = (doc) => {
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
    }, 30000);
  };
};

//Generate PDF
export const generatePDF = (data, refNo) => {
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
      drawText(`CBHI ID:`, marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      drawText(`${data.cbhiId || "N/A"}`, marginLeft + 35, yPos);
      yPos += lineHeight;
    } else if (data.method.toUpperCase().includes("CREDIT")) {
      doc.setFont("helvetica", "bold");
      drawText(`Organization:`, marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      drawText(`${data.organization || "N/A"}`, marginLeft + 35, yPos);
      yPos += lineHeight;
      doc.setFont("helvetica", "bold");
      drawText(`Employee Id:`, marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      drawText(`${data.employeeId || "N/A"}`, marginLeft + 35, yPos);
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
      `${capitalizeWords(numberToWords.toWords(totalAmount.toFixed(2)))} birr`,
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

const HospitalPayment = () => {
  const { language } = useLang();

  const [payments, setPayments] = useState([]);

  const [formData, setFormData] = useState(initialState);
  const [organizations, setOrganizations] = useState([]);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [cardNumberError, setCardNumberError] = useState("");
  const [trxRefError, settrxRefError] = useState("");
  const [paymentSummary, setPaymentSummary] = useState([]);
  const [paymentMethods, setPaymentMehods] = useState([]);
  const [digitalChannels, setDigitalChannels] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const navigate = useNavigate();

  //Inserting evry changet that the user makes on print into the loacl storage using the useEffect hooks
  // onchange of payments the useEffect runs
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
          console.log("What is wrong with you man: ", response?.data);
          setPayments(sortedPayment);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchPaymetInfo();
    updatePaymentSummary(payments);
  }, [refresh]);
  //payments
  useEffect(() => {
    setReasons([
      "Card",
      "For Examination",
      "Laboratory",
      "X-ray/Ultrasound",
      "Bed",
      "Medicines",
      "Surgery",
      "Food",
      "Other",
    ]);
  }, []);

  //fetch paymentmethods
  useEffect(() => {
    const fetchMeth = async () => {
      try {
        const response = await api.get("/Lookup/payment-type");
        if (response?.status === 200) {
          setPaymentMehods(
            response?.data
              ?.filter((item) => item.paymentType !== "ALL")
              .map((item) => item.paymentType)
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

  //Fetch Organization with agreement
  useEffect(() => {
    const fetchORG = async () => {
      try {
        const response = await api.get(
          `/Organiztion/Organization/${tokenvalue.name}`
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

  const updatePaymentSummary = (payments) => {
    const summary = payments.reduce((acc, payment) => {
      const { paymentType, paymentAmount } = payment;
      if (!acc[paymentType]) {
        acc[paymentType] = 0;
      }
      acc[paymentType] += parseFloat(paymentAmount);
      return acc;
    }, {});

    const mapped = Object.entries(summary).map(([key, value]) => ({
      method: key,
      amount: value,
    }));

    setPaymentSummary(mapped);
  };

  const handleChange = (e) => {
    try {
      setFormData({ ...formData, [e.target.name]: e.target.value });

      if (e.target.name === "trxref") {
        validateTransactionRef(e.target.value);
      }
      if (e.target.name === "cardNumber") {
        handleNumberOnlyCheck(e.target.value);
      }
      if (e.target.name === "method") {
        setFormData((prev) => ({
          ...prev,
          cbhiId: "",
          trxref: "",
          organization: "",
          employeeId: "",
          digitalChannel: "",
        }));
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const validateTransactionRef = (trxRef) => {
    const trxPattern = /^[A-Za-z0-9-_]{10,25}$/;

    if (!trxRef) {
      settrxRefError("Transaction reference is required");
    } else if (!trxPattern.test(trxRef)) {
      settrxRefError(
        "Invalid format. Use 10-25 characters with letters, numbers, -, _"
      );
    } else {
      settrxRefError("");
    }

    return;
  };

  const handleCheckboxChange = (reason) => {
    try {
      setFormData((prev) => {
        // Update reason array (toggle selection)
        const updatedReason = prev.reason.includes(reason)
          ? prev.reason.filter((r) => r !== reason)
          : [...prev.reason, reason];

        // Create a proper copy of the amount array
        const updatedAmount = [...prev.amount];

        // If the reason is being removed, remove the corresponding amount entry
        if (!updatedReason.includes(reason)) {
          return {
            ...prev,
            reason: updatedReason,
            amount: updatedAmount.filter((item) => item.purpose !== reason), // Remove related amount
          };
        }

        return { ...prev, reason: updatedReason, amount: updatedAmount };
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleAmountChange = (e, reason) => {
    try {
      setFormData((prev) => {
        const updatedAmount = prev.amount.map((item) =>
          item.purpose === reason
            ? { ...item, Amount: Math.abs(parseFloat(e.target.value)) }
            : item
        );

        if (!updatedAmount.some((item) => item.purpose === reason)) {
          updatedAmount.push({
            purpose: reason,
            Amount: Math.abs(parseFloat(e.target.value)),
          });
        }

        return { ...prev, amount: updatedAmount };
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleNumberOnlyCheck = (value) => {
    try {
      const regex = /^[0-9]{5,}$/;
      if (!regex.test(value)) {
        setCardNumberError("Please Insert Valid Card Number.");
      } else {
        setCardNumberError("");
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleSubmit = () => {
    try {
      if (
        !formData.cardNumber ||
        !!cardNumberError ||
        formData.reason.length <= 0 ||
        formData.amount.length <= 0 ||
        !formData.method ||
        (formData.method.toUpperCase().includes("DIGITAL") &&
          (!formData.digitalChannel ||
            !formData.trxref ||
            trxRefError.length > 0)) ||
        (formData.method.toUpperCase().includes("CBHI") && !formData.cbhiId) ||
        (formData.method.toUpperCase().includes("CREDIT") &&
          (!formData.organization || !formData.employeeId))
      ) {
        return window.alert("Please fill all the necessary fields!!");
      }

      // Validate amount based on reason
      const isAmountValid = formData.reason.every((reason) =>
        formData.amount.some(
          (item) => item.purpose === reason && item.Amount > 0
        )
      );

      if (!isAmountValid) {
        return window.alert(
          "Each reason must have a corresponding payment amount greater than 0!"
        );
      }

      setReceiptData(formData);
      setReceiptOpen(true);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleRegisterAndPrint = async () => {
    try {
      setIsPrintLoading(true);
      const newPayment = {
        id: payments.length + 1,
        ...receiptData,
        reason: receiptData.reason.join(", "),
      };

      const payload = {
        paymentType: formData?.method,
        cardNumber: formData.cardNumber,
        amount: formData.amount,
        description: formData?.description || "-",
        createdby: tokenvalue?.name,
        channel: formData.digitalChannel || "-",
        paymentVerifingID: formData.trxref || "-",
        patientWorkID: formData.employeeId || "-",
        organization: formData?.organization || "-",
        groupID: "-",
      };

      const response = await api.post("/Payment/add-payment", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 201) {
        try {
          // To Add patient Name on the Reciept
          const add = await api.put("/Payment/patient-info", {
            patientCardNumber: formData?.cardNumber,
            hospital: tokenvalue?.Hospital,
            cashier: tokenvalue?.name,
          });

          const final = {
            ...newPayment,
            patientName: add?.data[0]?.patientName,
          };
          setReceiptOpen(false);
          setFormData(initialState);
          toast.success(`Payment Regitstered Under ${response?.data?.refNo}`);
          setRefresh((prev) => !prev);

          generatePDF(final, response?.data?.refNo);
          setIsPrintLoading(false);
        } catch (error) {
          console.error(error);
          setIsPrintLoading(false);
        }
      }
    } catch (error) {
      console.error(error);
      setIsPrintLoading(false);
      toast.error(error?.response?.data?.msg || "Internal Server Error.");
    }
  };

 
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
      renderCell: (params) => (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            margin: 0,
            color:
              params?.row?.paymentType === "CASH"
                ? "green"
                : params?.row?.paymentType?.toUpperCase()?.includes("CREDIT")
                ? "red"
                : "black",
          }}
        >
          {params?.row?.paymentType}
        </span>
      ),
    },
    { field: "paymentReason", headerName: "Reason", width: 190 },
    {
      field: "paymentIsCollected",
      headerName: "Coll",
      width: 10,
      renderCell: (params) => {
        const { paymentIsCollected, paymentType } = params.row;
        const isCash = paymentType?.toLowerCase()?.includes("cash");

        if (isCash && paymentIsCollected === 1) {
          return <CheckCircleIcon sx={{ color: green[500] }} />;
        } else if (isCash && paymentIsCollected !== 1) {
          return <CancelIcon sx={{ color: orange[500] }} />;
        } else {
          return <RemoveCircleOutlineIcon sx={{ color: grey[500] }} />;
        }
      },
    },
  ];

  const openNewTab = (id) => {
    window.open(
      `https://cs.bankofabyssinia.com/slip/?trx=${id}`,
      "_blank",
      "noopener,noreferrer"
    );
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
    <Container>
      <Typography variant="h5" gutterBottom>
        {language === "AMH" ? "የክፍያ መቆጣጠሪያ" : "Hospital Payment Management"}
      </Typography>
      <Paper sx={{ padding: 2, marginBottom: 2, display: "flex", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <TextField
            label={language === "AMH" ? "የካርድ ቁጥርቁጥር" : "Card Number"}
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            fullWidth
            error={!!cardNumberError}
            helperText={cardNumberError}
            margin="normal"
            variant="outlined"
            sx={{
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
            FormHelperTextProps={{
              style: {
                color: !!cardNumberError ? "red" : "green",
                fontSize: "14px",
              },
            }}
          />
          <Typography variant="subtitle1" gutterBottom>
            {language === "AMH" ? "ምክንያት" : "Select Reason*"}
          </Typography>
          {reasons?.map((reason) => (
            <FormControlLabel
              key={reason}
              control={
                <Checkbox
                  checked={formData?.reason?.includes(reason)}
                  onChange={() => handleCheckboxChange(reason)}
                />
              }
              label={reason}
            />
          ))}

          {/* TextFields for Selected Checkboxes */}
          {formData?.reason?.map((reason) => (
            <TextField
              key={reason}
              name={reason}
              label={`${reason} Amount`}
              fullWidth
              required
              margin="normal"
              value={
                formData?.amount?.find((item) => item.purpose === reason)
                  ?.Amount || ""
              }
              onChange={(e) => handleAmountChange(e, reason)}
              type="number"
              inputProps={{
                min: 1, // Prevents negative values
                step: "any", // Allows decimal values
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px", // Rounded edges for a modern look

                  "&:hover fieldset": {
                    borderColor: "info.main", // Changes border color on hover
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main", // Focus effect
                    boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                  },
                },
              }}
            />
          ))}

          <TextField
            select
            label="Payment Method"
            name="method"
            value={formData.method}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px", // Rounded edges for a modern look

                "&:hover fieldset": {
                  borderColor: "info.main", // Changes border color on hover
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main", // Focus effect
                  boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                },
              },
            }}
          >
            {paymentMethods?.map((method) => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </TextField>
          {formData?.method.toUpperCase().includes("DIGITAL") && (
            <>
              <TextField
                select
                label="Digital Channel"
                name="digitalChannel"
                value={formData.digitalChannel}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px", // Rounded edges for a modern look

                    "&:hover fieldset": {
                      borderColor: "info.main", // Changes border color on hover
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main", // Focus effect
                      boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                    },
                  },
                }}
              >
                {digitalChannels?.map((channel) => (
                  <MenuItem key={channel} value={channel}>
                    {channel}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Transaction Reference No"
                name="trxref"
                value={formData.trxref}
                error={!!trxRefError}
                helperText={trxRefError}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px", // Rounded edges for a modern look

                    "&:hover fieldset": {
                      borderColor: "info.main", // Changes border color on hover
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main", // Focus effect
                      boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleOpenPage} edge="end">
                        <OpenInNewIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              ></TextField>
            </>
          )}
          {formData?.method.trim().toUpperCase().includes("CBHI") && (
            <TextField
              label="CBHI ID Number"
              name="cbhiId"
              value={formData.cbhiId}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
              FormHelperTextProps={{
                style: { color: "green", fontSize: "14px" },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px", // Rounded edges for a modern look

                  "&:hover fieldset": {
                    borderColor: "info.main", // Changes border color on hover
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main", // Focus effect
                    boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                  },
                },
              }}
            />
          )}
          {formData?.method.toUpperCase().includes("CREDIT") && (
            <>
              <TextField
                select
                label="Organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                required
                fullWidth
                margin="normal"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px", // Rounded edges for a modern look

                    "&:hover fieldset": {
                      borderColor: "info.main", // Changes border color on hover
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main", // Focus effect
                      boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                    },
                  },
                }}
              >
                {organizations.map((org) => (
                  <MenuItem key={org} value={org}>
                    {org}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Employee Id"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
                fullWidth
                margin="normal"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px", // Rounded edges for a modern look

                    "&:hover fieldset": {
                      borderColor: "info.main", // Changes border color on hover
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main", // Focus effect
                      boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                    },
                  },
                }}
              />
            </>
          )}

          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            margin="normal"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px", // Rounded edges for a modern look

                "&:hover fieldset": {
                  borderColor: "info.main", // Changes border color on hover
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main", // Focus effect
                  boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                },
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ marginTop: 2 }}
            onClick={handleSubmit}
          >
            Check Receipt
          </Button>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ padding: 2, marginBottom: 2 }}>
            <Typography variant="h3">Payment Summary</Typography>
            <hr />
            {/* <SmartCards data={paymentSummary} /> */}
            {paymentSummary.map((summary) => (
              <Box
                key={summary.method}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 1,
                }}
              >
                <Typography sx={{ fontWeight: "bolder" }}>
                  {summary.method}
                </Typography>
                <Typography>{formatAccounting(summary.amount)}</Typography>
              </Box>
            ))}
            <hr />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 1,
              }}
            >
              <Typography sx={{ fontWeight: "bolder" }}>Total</Typography>

              <Typography>
                {formatAccounting(
                  paymentSummary
                    .map((e) => e.amount)
                    .reduce((acc, num) => acc + num, 0)
                )}
              </Typography>
            </Box>
          </Paper>
          <Button
            variant="contained"
            color="success"
            //startIcon={<AttachMoneyIcon />}
            onClick={() => navigate("/payment-entry")}
            sx={{
              display: "flex",
              marginTop: "100px",
              justifySelf: "flex-end",
            }}
          >
            Back To List
          </Button>
        </Box>
      </Paper>
      <Paper sx={{ height: 400 }}>
        <DataGrid
          rows={payments.length ? payments : []}
          columns={columns}
          getRowId={(row) => row.patientCardNumber}
        />
      </Paper>
      <ReceiptModal
        open={receiptOpen}
        onClose={() => {
          setReceiptOpen(false);
        }}
        data={receiptData}
        onPrint={handleRegisterAndPrint}
        onloading={isPrintLoading}
      />
      <ToastContainer />
    </Container>
  );
};
export default HospitalPayment;
