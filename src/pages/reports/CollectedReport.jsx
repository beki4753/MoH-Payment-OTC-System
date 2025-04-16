import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import api from "../../utils/api";
import { getTokenValue } from "../../services/user_service";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatAccounting2 } from "../hospitalpayment/HospitalPayment";

const tokenvalue = getTokenValue();
const CollectedReport = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showOnlyHighAmount, setShowOnlyHighAmount] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [data, setData] = useState([]);

  const fetchReportData = async (e) => {
    try {
      e.preventDefault();
      const response = await api.put("/Collection/Get-all-Collection", {
        startDate: startDate,
        endDate: endDate,
        user: tokenvalue?.name,
        isCollected: 0,
      });
      if (response?.data.length <= 0) toast.info("Report not found!");
      const data =
        response?.data.length > 0
          ? response?.data?.map(({ collectionId, ...rest }) => ({
              id: collectionId,
              ...rest,
            })) || []
          : [];
      setData(data.length <= 0 ? new Array() : data);
    } catch (error) {
      console.error("Error fetching report data:", error);
    }
  };

  const filterData = () => {
    try {
      if (data.length > 0) {
        const filteredData = data?.filter((item) => {
          if (
            showOnlyHighAmount &&
            item.collectedAmount <
              Math.max(...data?.map((item) => item?.collectedAmount))
          )
            return false;
          return true;
        });
        setFilteredData(filteredData);
      } else {
        toast.info("There is No High Amount!");
        setFilteredData([]);
      }
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  useEffect(() => {
    if (showOnlyHighAmount) {
      filterData();
    }
  }, [showOnlyHighAmount]);

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(
        filteredData.length > 0 ? filteredData : data
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        ws,
        `Collection Report of ${tokenvalue?.name}`
      );
      XLSX.writeFile(
        wb,
        `Collection_Report from ${startDate} to ${endDate}.xlsx`
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Collection Report
      </Typography>
      <form onSubmit={fetchReportData}>
        <Paper
          sx={{
            padding: 2,
            marginBottom: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setShowOnlyHighAmount(false);
            }}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setShowOnlyHighAmount(false);
            }}
            InputLabelProps={{ shrink: true }}
            required
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showOnlyHighAmount}
                onChange={(e) => setShowOnlyHighAmount(e.target.checked)}
              />
            }
            label="Show High Amount"
          />
          <Button variant="contained" color="secondary" type="submit">
            Request Report
          </Button>
        </Paper>
      </form>
      <Paper sx={{ height: 400, marginBottom: 2 }}>
        <DataGrid
          rows={showOnlyHighAmount ? filteredData : data}
          columns={[
            { field: "id", headerName: "ID", width: 40 },
            { field: "fromDate", headerName: "Start Date", width: 150 },
            { field: "toDate", headerName: "End Date", width: 140 },
            {
              field: "collectedAmount",
              headerName: "Amount",
              width: 130,
              renderCell: (params) =>
                formatAccounting2(params.row.collectedAmount),
            },
            { field: "collectedBy", headerName: "Collector", width: 200 },
            { field: "casher", headerName: "Cashier", width: 200 },
            {
              field: "collectedOn",
              headerName: "Collected Date",
              width: 170,
            },
          ]}
        />
      </Paper>
      <Button
        variant="contained"
        color="primary"
        onClick={() => exportToExcel()}
      >
        Export to Excel
      </Button>
      <ToastContainer />
    </Container>
  );
};

export default CollectedReport;
