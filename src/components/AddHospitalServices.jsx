import React, { useRef, useState } from "react";
import {
  Modal,
  Typography,
  Box,
  Button,
  Stack,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { CancelPresentationTwoTone } from "@mui/icons-material";

const AddHospitalServices = ({
  isOpen = false,
  setIsOpen,
  onSubmit,
  loading,
  setLoading,
}) => {
  const [rows, setRows] = useState([]);
 const fileInput = useRef(null)
  const columns = [
    { field: "Services", headerName: "Hospital Services", flex: 1 },
    { field: "Amount", headerName: "Amount", flex: 1 },
  ];

  const handleFileUpload = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet);

        const rowsData = parsedData.map((prev, index) => ({
          id: index + 1,
          ...prev,
        }));

        setRows(rowsData);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("File Upload Error: ", error);
    }
  };

  const handleUploadToServer = async () => {
    try {
      onSubmit({
        services: rows.map((item) => item.Services),
        Amount: rows.map((item) => item.Amount),
      });
    } catch (error) {
      console.error(error);
      toast.error("Upload failed.");
    }
  };

  const handleClose = () => {
    try {
      setIsOpen(false);
      setRows([]);
      setLoading(false);
    } catch (error) {
      console.error("Close error", error);
    }
  };


  const handleReset = ()=>{
    setRows([]);
    fileInput.current.value = null;
  }

  return (
    <Modal
      open={isOpen}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          handleClose();
        }
      }}
      aria-labelledby="modal-title"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80%",
          maxHeight: "90vh",
          overflowY: "auto",
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 3,
        }}
      >
        <Typography variant="h6" gutterBottom id="modal-title">
          Upload Hospital Services (Excel)
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <input ref={fileInput} type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
          <IconButton
            onClick={handleReset}
            color="error"
            sx={{ marginLeft: 2 }}
          >
            <CancelPresentationTwoTone />
          </IconButton>
          <Button
            variant="contained"
            disabled={!rows.length || loading}
            onClick={handleUploadToServer}
          >
            {loading ? <CircularProgress size={24} /> : "Upload to Database"}
          </Button>
        </Stack>
        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid rows={rows} columns={columns} />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "right", width: "100%" }}>
          <Button
            variant="contained"
            sx={{ margin: "10px" }}
            onClick={() => handleClose()}
            color="error"
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default AddHospitalServices;
