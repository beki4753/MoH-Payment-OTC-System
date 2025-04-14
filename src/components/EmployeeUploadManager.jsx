import React, { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import { CancelPresentationTwoTone } from "@mui/icons-material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import api from "../utils/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getTokenValue } from "../services/user_service";

const tokenvalue = getTokenValue();
const EmployeeUploadManager = () => {
  const [fileData, setFileData] = useState([]);
  const [data, setData] = useState([]);
  const [refresh, setRefresh] = useState(false);

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
        const pp = parsedData.map(({ HospitalName, ...rest }) => ({
          assignedLocation: HospitalName,
          ...rest,
        }));

        const withIds = pp.map((prev, index) => ({
          ...prev,
          id: index + 1,
        }));

        setFileData(withIds);
        event.target.value = null;
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUploadToDatabase = async () => {
    try {
      const response = await api.post("/Collection/register_collector", {
        employeeID: fileData.map((Item) => Item?.employeeID),
        employeeName: fileData.map((Item) => Item?.employeeName),
        employeePhone: fileData.map((Item) => Item?.employeePhone),
        employeeEmail: fileData.map((Item) => Item?.employeeEmail),
        assignedAs: fileData.map((Item) => Item?.assignedAs),
        assignedBy: fileData.map((Item) => Item?.assignedBy),
        contactMethod: fileData.map((Item) => Item?.contactMethod),
        user: tokenvalue?.name,
      });
      toast.success("Upload Successful.");
      setRefresh((prev) => !prev);
      setFileData([]);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error?.response?.data || "Internal Server Error.");
    }
  };

  useEffect(() => {
    const fetchEmp = async () => {
      try {
        const response = await api.get(
          `/Collection/collector/${tokenvalue?.name}`
        );

        
        setData(response?.data<= 0 ? new Array() : response?.data);
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data || "Failde To Load list.");
      }
    };

    fetchEmp();
  }, [refresh]);

  const handleDeleteAll = () => {
    setFileData([]);
  };

  const columns = [
    { field: "employeeID", headerName: "Employee ID", flex: 1 },
    { field: "employeeName", headerName: "Employee Name", flex: 1 },
    { field: "employeePhone", headerName: "Phone", flex: 1 },
    { field: "employeeEmail", headerName: "Email", flex: 1 },
    { field: "assignedAs", headerName: "Assigned As", flex: 1 },
    { field: "assignedBy", headerName: "Assigned By", flex: 1 },
    { field: "contactMethod", headerName: "Contact Method", flex: 1 },
  ];

  const CustomErrorOverlay = () => {
    toast.error("Id Missing");
    return (
      <div style={{ padding: "20px", color: "red" }}>
        An error occurred: Id Missing
      </div>
    );
  };

  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Employee ID - Hospital Mapping
      </Typography>
      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <input
          accept=".xlsx, .xls"
          type="file"
          onChange={(e) => {
            handleFileUpload(e);
          }}
          style={{ display: "none" }}
          id="upload-excel"
        />
        <label htmlFor="upload-excel">
          <Button
            variant="contained"
            component="span"
            startIcon={<CloudUploadIcon />}
          >
            Upload Excel
          </Button>
        </label>
        <IconButton
          onClick={handleDeleteAll}
          color="error"
          sx={{ marginLeft: 2 }}
        >
          <CancelPresentationTwoTone />
        </IconButton>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUploadToDatabase}
          sx={{ marginLeft: 2 }}
          disabled={fileData.length === 0}
        >
          Upload to Database
        </Button>
        <Typography variant="h6" sx={{ m: "15px 0 5px 20px" }}>
          {fileData.length > 0 ? "Viewing from File" : "Viewing Registered"}
        </Typography>
      </Paper>
      <Paper sx={{ height: 400 }}>
        <DataGrid
          rows={fileData.length <= 0 ? data : fileData}
          columns={columns}
          // getRowId={(row) => row.id}
          // error={error}
          components={{
            ErrorOverlay: CustomErrorOverlay,
          }}
        />
      </Paper>
      <ToastContainer />
    </Container>
  );
};

export default EmployeeUploadManager;
