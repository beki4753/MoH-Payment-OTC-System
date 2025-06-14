import api from "../utils/api";

export async function GetAllPaymentByDate(data) {
  const response = await api.put("/Payment/Get-all-Payment", data);
  return response.data;
}

export async function GetAllPaymentType() {
  const response = await api.get("/Lookup/payment-type");

  return response.data;
}
