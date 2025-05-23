import api from "../utils/api";

export async function GetAllPaymentByDate(data) {
  console.log("This is the Date Data: ", data);
  const response = await api.put("/Payment/Get-all-Payment", data);
  console.log("This is the Data: ", response?.data);
  const modData =
    response?.data?.length > 0
      ? response?.data?.map(({ rowId, ...rest }, index) => ({
          id: rowId,
          ...rest,
        }))
      : [];
  return modData;
}

export async function GetAllPaymentType() {
  const response = await api.get("/Lookup/payment-type");

  return response.data;
}
