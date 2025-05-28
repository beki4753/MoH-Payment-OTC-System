import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Button,
  Box,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import { renderETDateAtCell } from "./PatientSearch";
function ReversalModal({ open, onClose, receipt, onConfirm, loading }) {
  const [reason, setReason] = useState("");
  const [supervisorPin, setSupervisorPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    try {
      if (!reason.trim()) {
        setError("Reversal reason is required.");
        return;
      }

      if (reason.length < 10) {
        setError("Please describe it using more than 10 characters.");
        return;
      }

      setError("");

      const t = {
        rowId: 6,
        referenceNo: "DB123123CASH2025527165027965224738",
        patientCardNumber: "123123",
        hospitalName: "DB Tena tabiya",
        department: "Card",
        paymentChannel: "-",
        paymentType: "CASH",
        patientName: "Ashabir Anberbir Hone",
        patientPhone: "",
        patientAge: "15",
        patientAddress: null,
        patientGender: "Male",
        patientVisiting: "2025-05-27T00:00:00",
        patientType: "",
        paymentVerifingID: "-",
        patientLoaction: null,
        patientWorkingPlace: null,
        patientWorkID: null,
        patientWoreda: null,
        patientKebele: null,
        patientsGoth: null,
        patientCBHI_ID: null,
        patientReferalNo: null,
        patientLetterNo: null,
        patientExamination: null,
        paymentReason: "FOR EXAMINATION",
        paymentAmount: 100,
        paymentDescription: "dfvsrefdcc",
        paymentIsCollected: 0,
        accedentDate: null,
        policeName: null,
        policePhone: null,
        carPlateNumber: null,
        carCertificate: null,
        registeredBy: "Test1",
        registeredOn: "2025-05-27T00:00:00",
      };
      const payload = {
        paymentType: receipt?.paymentType || "-",
        cardNumber: receipt?.patientCardNumber || "-",
        amount: [
          {
            amount: -receipt?.paymentAmount || 0,
            purpose: receipt?.paymentReason || "-",
          },
        ],
        description: reason || "-",
        channel: receipt?.paymentChannel || "-",
        organization: receipt?.patientWorkingPlace || "-",
        paymentVerifingID: receipt?.paymentVerifingID || "-",
        patientWorkID: receipt?.patientWorkID || "-",
      };
      onConfirm(payload);

      // Reset fields
      setReason("");
      setSupervisorPin("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleClose = () => {
    setReason("");
    setSupervisorPin("");
    setError("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          handleClose();
        }
      }}
      maxWidth="sm"
      fullWidth
      disableEnforceFocus
    >
      <DialogTitle>Reversal Request</DialogTitle>
      <DialogContent>
        <Box
          mb={3}
          p={2}
          borderRadius={2}
          sx={{ boxShadow: "inset 0px 0px 3px 2px #0000008a" }}
          bgcolor="#f9f9f9"
        >
          <Typography variant="h6" gutterBottom>
            📄 Receipt Summary
          </Typography>

          <Box display="flex" justifyContent="space-between" py={0.5}>
            <Typography color="text.secondary">Receipt No:</Typography>
            <Typography fontWeight={600}>{receipt?.referenceNo}</Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" py={0.5}>
            <Typography color="text.secondary">Patient Name:</Typography>
            <Typography fontWeight={600}>{receipt?.patientName}</Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" py={0.5}>
            <Typography color="text.secondary">Payment Reason:</Typography>
            <Typography fontWeight={500}>{receipt?.paymentReason}</Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" py={0.5}>
            <Typography color="text.secondary">Amount Paid:</Typography>
            <Typography fontWeight={700} color="green">
              ETB {Number(receipt?.paymentAmount).toFixed(2)}
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" py={0.5}>
            <Typography color="text.secondary">Date:</Typography>
            <Typography fontStyle="italic" fontWeight={500}>
              {renderETDateAtCell(receipt?.registeredOn)}
            </Typography>
          </Box>
        </Box>

        <Divider />

        <Box mt={5}>
          <TextField
            label="Reason for Reversal"
            multiline
            fullWidth
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Box>

        {error && (
          <Box mt={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => handleSubmit()}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Confirm Reversal"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ReversalModal;
