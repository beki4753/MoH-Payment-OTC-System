import React, { useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Dashboard,
  Bar,
  Form,
  Line,
  Pie,
  FAQ,
  Login,
  Geography,
  Calendar,
  NotFoundPage,
  RootLayout,
  ProfilePage,
  HospitalPayment,
  ReportPage,
  BankerComponent,
  CollectedReport,
} from "./pages";

import { logout as logoutAction } from "./services/user_service.js";
import { getTokenValue, getSession, logout } from "./services/user_service.js";
import useTokenCheck from "./services/useTokenCheck.js";

import {
  OrgUploadManager,
  UserManagment,
  RoleManagment,
  FinancialDashboard,
  PaymentManagementLists,
  EmployeeUploadManager,
  ReportReceiptFetcher,
} from "./components";

const tokenvalue = getTokenValue();

const token = getSession();
const ProtectedRoute = ({ element, allowedRoles }) => {
  const role =
    tokenvalue["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

  if (!token) {
    logout();
    return;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return element;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />, // Ensuring layout consistency
    errorElement: <NotFoundPage />,
    id: "root",
    loader: getSession,
    children: [
      { index: true, element: <ProtectedRoute element={<Dashboard />} /> },
      { path: "login", element: <Login /> },
      { path: "logout", action: logoutAction },
      // { path: "profile", element: <ProtectedRoute element={<Profile />} /> },

      // Role-based protected routes
      {
        path: "UserManagment",
        element: (
          <ProtectedRoute
            element={<UserManagment />}
            allowedRoles={["Admin"]}
          />
        ),
      },
      {
        path: "payment-channel",
        element: (
          <ProtectedRoute
            element={<PaymentManagementLists />}
            allowedRoles={["Admin"]}
          />
        ),
      },
      {
        path: "payments",
        element: (
          <ProtectedRoute
            element={<HospitalPayment />}
            allowedRoles={["User"]}
          />
        ),
      },
      {
        path: "find-patient",
        element: (
          <ProtectedRoute
            element={<ReportReceiptFetcher />}
            allowedRoles={["User"]}
          />
        ),
      },
      {
        path: "cash-managment",
        element: (
          <ProtectedRoute
            element={<BankerComponent />}
            allowedRoles={["User"]}
          />
        ),
      },
      {
        path: "money-submission",
        element: (
          <ProtectedRoute
            element={<FinancialDashboard />}
            allowedRoles={["User"]}
          />
        ),
      },
      {
        path: "reports",
        element: (
          <ProtectedRoute element={<ReportPage />} allowedRoles={["User"]} />
        ),
      },
      {
        path: "collection-reports",
        element: (
          <ProtectedRoute
            element={<CollectedReport />}
            allowedRoles={["User"]}
          />
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute
            element={<ProfilePage />}
            allowedRoles={["Admin", "User"]}
          />
        ),
      },
      {
        path: "BankerManagment",
        element: (
          <ProtectedRoute
            element={<EmployeeUploadManager />}
            allowedRoles={["Admin"]}
          />
        ),
      },
      {
        path: "credit-users",
        element: (
          <ProtectedRoute
            element={<OrgUploadManager />}
            allowedRoles={["Admin"]}
          />
        ),
      },
      {
        path: "RoleManagment",
        element: (
          <ProtectedRoute
            element={<RoleManagment />}
            allowedRoles={["Admin"]}
          />
        ),
      },

      // Publicly accessible routes
      { path: "form", element: <ProtectedRoute element={<Form />} /> },
      { path: "bar", element: <ProtectedRoute element={<Bar />} /> },
      { path: "pie", element: <ProtectedRoute element={<Pie />} /> },
      { path: "line", element: <ProtectedRoute element={<Line />} /> },
      { path: "faq", element: <ProtectedRoute element={<FAQ />} /> },
      { path: "calendar", element: <ProtectedRoute element={<Calendar />} /> },
      {
        path: "geography",
        element: <ProtectedRoute element={<Geography />} />,
      },
      { path: "unauthorized", element: <h1>Not Allowed!!</h1> },

      // Catch-All Route
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

const queryClient = new QueryClient();

function App() {
  useTokenCheck();

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
