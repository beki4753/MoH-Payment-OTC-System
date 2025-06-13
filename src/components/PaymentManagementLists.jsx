import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Edit, Delete } from "@mui/icons-material";
import api from "../utils/api";
import { getTokenValue } from "../services/user_service";

const tokenvalue = getTokenValue();
const categories = [
  "Digital Payment Channels",
  "CBHI Providers",
  "Organizations with Agreements",
  "Hospital Services",
  "Payment Methods",
];

const PaymentManagementLists = () => {
  const [data, setData] = useState({});
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ category: "", name: "" });
  const [editId, setEditId] = useState(null);
  const [refresh, setRefresh] = useState(false);
  // Generalized fetch function
  const fetchData = async (endpoint, key, mapFunction) => {
    try {
      const response = await api.get(endpoint);
      if (response?.status === 200 || response?.status === 201) {
        const result = {
          [key]: response?.data,
        };
        setData((prevData) => ({ ...prevData, ...result }));
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  // Fetch Payment Methods
  useEffect(() => {
    fetchData("/Lookup/payment-type", "Payment Methods", (item) => item.type);
  }, [refresh]);

  // Fetch Digital Channels
  useEffect(() => {
    fetchData(
      "/Lookup/payment-channel",
      "Digital Payment Channels",
      (item) => item.channel
    );
  }, [refresh]);

  // Fetch Paymet purpose
  useEffect(() => {
    fetchData(
      "/Lookup/payment-purpose",
      "Hospital Services",
      (item) => item.purpose
    );
  }, [refresh]);

  // Fetch CBHI Provider
  useEffect(() => {
    fetchData(
      `/Providers/list-providers/${tokenvalue.name}`,
      "CBHI Providers",
      (item) => item.provider
    );
  }, [refresh]);

  // Fetch Organization with Agreement
  useEffect(() => {
    fetchData(
      `/Organiztion/Organization/${tokenvalue.name}`,
      "Organizations with Agreements",
      (item) => item.organization
    );
  }, [refresh]);

  const handleOpen = (category, item = "", id = null) => {
    setFormData({ category, name: item });
    setEditId(id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditId(null);
    setFormData({ category: "", name: "" });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, name: e.target.value });
  };
  const handleSubmit = async () => {
    try {
      const { category, name } = formData;
      if (!name.trim()) return;

      const apiEndpoints = {
        "Digital Payment Channels": "/Lookup/payment-channel",
        "Payment Methods": "/Lookup/payment-type",
        "Hospital Services": "/Lookup/payment-purpose",
        "CBHI Providers": "/Providers/add-provider",
        "Organizations with Agreements": "/Organiztion/Organization",
      };

      const apiEndpointsEdit = {
        "Digital Payment Channels": "/Lookup/payment-channel",
        "Payment Methods": "/Lookup/payment-type",
        "Hospital Services": "/Lookup/payment-purpose",
        "CBHI Providers": "/Providers/update-provider",
        "Organizations with Agreements": "/Organiztion/Organization",
      };

      const requestBody = {
        "Digital Payment Channels": {
          channel: name,
          createdBy: tokenvalue.name,
        },
        "Payment Methods": { type: name, createdBy: tokenvalue.name },
        "Hospital Services": { purpose: name, createdBy: tokenvalue.name },
        "CBHI Providers": {
          provider: name,
          service: "CBHI",
          createdBy: tokenvalue.name,
        },
        "Organizations with Agreements": {
          organization: name,
          createdBy: tokenvalue.name,
        },
      };

      const requestBodyEdit = {
        "Digital Payment Channels": {
          id: Number(editId),
          channel: name,
          updatedBy: tokenvalue.name,
          updatedOn: new Date().toISOString(),
        },
        "Payment Methods": {
          id: Number(editId),
          type: name,
          updatedBy: tokenvalue.name,
          updatedOn: new Date().toISOString(),
        },
        "Hospital Services": {
          id: Number(editId),
          purpose: name,
          updatedBy: tokenvalue.name,
          updatedOn: new Date().toISOString(),
        },
        "CBHI Providers": {
          id: Number(editId),
          provider: name,
          service: "CBHI",
          updatedBy: tokenvalue.name,
          updatedOn: new Date().toISOString(),
        },

        "Organizations with Agreements": {
          id: Number(editId),
          organization: name,
          updatedBy: tokenvalue.name,
          updatedOn: new Date().toISOString(),
        },
      };

      if (editId !== null && apiEndpointsEdit[category]) {
        try {
          const response = await api.put(
            apiEndpointsEdit[category],
            requestBodyEdit[category]
          );

          toast.success(`${category} updated successfully!`);
          setRefresh((prev) => !prev);
          handleClose();
        } catch (error) {
          console.error("Update error:", error);
          toast.error(error?.response?.data || "Error updating data!");
        }
      }

      if (apiEndpoints[category] && editId === null) {
        const response = await api.post(
          apiEndpoints[category],
          requestBody[category],
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        if (response.status === 201 || response.status === 200) {
          toast.success(`${category} added successfully!`);
          setRefresh((prev) => !prev);
          handleClose();
          return;
        }
      }

      handleClose();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error?.response?.data || "Internal Server Error!");
    }
  };

  const handleDelete = async (category, id) => {
    try {
      const apiEndpoints = {
        "Digital Payment Channels": "/Lookup/payment-channel",
        "Hospital Services": "/Lookup/payment-purpose",
        "Payment Methods": "/Lookup/payment-type",
        "CBHI Providers": "/Providers/delete-provider",
        "Organizations with Agreements": "/Organiztion/Organization",
      };

      if (apiEndpoints[category]) {
        const response = await api.delete(apiEndpoints[category], {
          headers: { "Content-Type": "application/json" },
          data: { id: id, deletedBy: tokenvalue.name },
        });

        if (response.status === 200) {
          toast.success(`${category} deleted successfully!`);
          setRefresh((prev) => !prev);
        }
      } else {
        console.warn(`No API endpoint found for category: ${category}`);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete item. Please try again.");
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Payment Management
      </Typography>
      {categories.map((category) => (
        <div key={category} style={{ marginBottom: "20px" }}>
          <Typography variant="h6" gutterBottom>
            {category}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen(category)}
            style={{ marginBottom: "10px" }}
          >
            Add {category}
          </Button>
          <DataGrid
            rows={(data[category] || []).map((item, index) => ({
              id:
                category === "Digital Payment Channels"
                  ? item.id
                  : category === "Payment Methods"
                  ? item.id
                  : category === "Hospital Services"
                  ? item.id
                  : category === "CBHI Providers"
                  ? item.id
                  : category === "Organizations with Agreements"
                  ? item.id
                  : "",

              name:
                category === "Digital Payment Channels"
                  ? item.channel
                  : category === "Payment Methods"
                  ? item.type
                  : category === "Hospital Services"
                  ? item.purpose
                  : category === "CBHI Providers"
                  ? item.provider
                  : category === "Organizations with Agreements"
                  ? item.organization
                  : "",
            }))}
            columns={[
              {
                field: "name",
                headerName: "Name",
                flex: 1,
              },
              {
                field: "actions",
                headerName: "Actions",
                renderCell: (params) =>
                  ![
                    "CASH",
                    "ALL",
                    "CBHI",
                    "Credit",
                    "Free of Charge",
                    "Digital",
                    "TeleBirr",
                    "CBE Mobile Banking",
                    "BANK OF ABYSSINIA",
                    "Awash Bank",
                  ]
                    .map((item) => item.toUpperCase())
                    .includes(params.row.name.toUpperCase()) && (
                    <>
                      <IconButton
                        onClick={() => {
                          handleOpen(category, params.row.name, params.row.id);
                        }}
                      >
                        <Edit />
                      </IconButton>

                      <IconButton
                        onClick={() => handleDelete(category, params.row.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </>
                  ),
                flex: 0.5,
              },
            ]}
            autoHeight
          />
        </div>
      ))}

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {editId !== null ? "Edit" : "Add"} {formData.category}
        </DialogTitle>
        <DialogContent
          style={{
            display: "flex",
            height: "100px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={handleChange}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <ToastContainer />
    </Container>
  );
};

export default PaymentManagementLists;
