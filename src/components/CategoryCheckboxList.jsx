import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
} from "@mui/material";

const CategoryCheckboxList = ({ selectedRow, setSelectedRow }) => {
  if (!selectedRow) return null;

  const handleCheckboxChange = (index, isChecked) => {
    const updatedCategories = selectedRow.requestedCatagories.map((cat, i) =>
      i === index ? { ...cat, isPaid: isChecked } : cat
    );

    setSelectedRow((prev) => ({
      ...prev,
      requestedCatagories: updatedCategories,
    }));
  };

  return (
    <Card sx={{ mb: 2, p: 2 }}>
      <CardHeader
        title="Requested Categories"
        sx={{ backgroundColor: "#f5f5f5", textAlign: "center" }}
      />
      <Divider />
      <CardContent>
        {selectedRow.requestedCatagories?.length === 0 ? (
          <Typography color="text.secondary" align="center">
            No categories found.
          </Typography>
        ) : (
          <Box
            sx={{
              maxHeight: 300,
              overflowY: "auto",
              pr: 1,
            }}
          >
            <FormGroup>
              {selectedRow.requestedCatagories.map((item, index) => (
                <FormControlLabel
                  key={item.groupID}
                  control={
                    <Checkbox
                      checked={!!item.isPaid}
                      onChange={(e) =>
                        handleCheckboxChange(index, e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 500 }}>
                      {item.purpose}
                    </Typography>
                  }
                />
              ))}
            </FormGroup>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryCheckboxList;
