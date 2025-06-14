import React, { useState, useEffect } from "react";
import {
    Container,
    Tabs,
    Tab,
    Paper,
    Typography,
    Button,
    TextField,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import { GetAllPaymentByDate } from "../../services/report_service";
import { getTokenValue } from "../../services/user_service";


const paymentMethods = [
    "All",
    "CASH",
    "Digital",
    "CBHI",
    "Free Service",
    "Credit",
];

const ReportPage = () => {
    const [payments, setPayments] = useState([]);

    const [selectedMethod, setSelectedMethod] = useState("All");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filteredPayments, setFilteredPayments] = useState(payments);


    var tokenValue = getTokenValue();

    // useEffect(() => {
    //   localStorage.setItem("hospitalPayments", JSON.stringify(payments));
    // }, [payments]);


    useEffect(() => {
        setFilteredPayments(
            payments.filter(
                (payment) =>
                    (selectedMethod === "All" || payment.type === selectedMethod)
            )
        );
    }, [selectedMethod, startDate, endDate, payments]);

    const handleMethodChange = (event, newValue) => {
        setSelectedMethod(newValue);
    };

    const calculateTotal = (method) => {
        return payments
            .filter(
                (payment) =>
                    (method === "All" || payment.type === method)
            )
            .reduce((sum, payment) => sum + Number(payment.amount), 0); // Ensure amount is treated as a number
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredPayments);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payments Report");
        XLSX.writeFile(
            wb,
            `Payments_Report_${startDate}_to_${endDate}_${selectedMethod}.xlsx`
        );
    };

    const columns = [

        { field: "refNo", headerName: "Ref No.", width: 200 },
        { field: "hospitalName", headerName: "Hospital Name", width: 150 },
        { field: "cardNumber", headerName: "Card Number", width: 150 },
        { field: "purpose", headerName: "Service", width: 150 },
        { field: "amount", headerName: "Amount", width: 120 },
        { field: "type", headerName: "Payment Method", width: 150 },
        { field: "description", headerName: "Description", width: 200 },
        { field: "createdOn", headerName: "Date", width: 150 },
        { field: "createdby", headerName: "Created by", width: 150 },


    ];
    const handleReportRequest = async () => {
        try {
            const datas = await GetAllPaymentByDate({
                startDate,
                endDate,
                user: tokenValue.name,
            });
            setPayments(datas);

            setFilteredPayments(
                payments.filter(
                    (payment) =>
                        (selectedMethod === "All" || payment.type === selectedMethod)
                )
            );

        } catch (error) {
            console.error("Error fetching payments:", error);
        }
    };
    return (
        <>
            <Typography variant="h5" gutterBottom sx={{ margin: 2 }}>
                Payment Reports
            </Typography>
            <Paper sx={{ padding: 2, margin: 2 }}>
                <TextField
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                    sx={{ marginRight: 2 }}
                />
                <TextField
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                    sx={{ marginRight: 2 }}
                />
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleReportRequest}
                    sx={{ marginRight: 2 }}
                >
                    Request Report
                </Button>
                <Tabs
                    value={selectedMethod}
                    onChange={handleMethodChange}
                    variant="scrollable"
                    sx={{ marginTop: 2 }}
                >
                    {paymentMethods.map((method) => (
                        <Tab
                            key={method}
                            label={`${method} (${calculateTotal(method)})`}
                            value={method}
                        />
                    ))}
                </Tabs>
            </Paper>
            <Paper sx={{ height: 400, margin: 2 }}>
                <DataGrid
                    rows={filteredPayments.length ? filteredPayments : []}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                />
            </Paper>
            <Button
                sx={{ marginLeft: 2 }}
                variant="contained"
                color="primary"

                onClick={exportToExcel}
            >
                Export to Excel
            </Button>
        </>
    );
};

export default ReportPage;