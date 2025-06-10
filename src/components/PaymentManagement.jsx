import React, { useState, useEffect } from 'react';
import {
	Box,
	Button,
	Grid,
	Modal,
	Typography,
	TextField,
	Select,
	MenuItem,
	FormControl,
	Paper,
	Card,
	Avatar,
	CircularProgress,
	InputAdornment,
	Stack,
	IconButton,
	useTheme,
} from '@mui/material';
import { tokens } from '../theme';
import { PDFDocument, rgb } from 'pdf-lib';
import ReactDOM from 'react-dom/client';
import RenderPDF from '../pages/hospitalpayment/RenderPDF';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import PaymentIcon from '@mui/icons-material/Payment';
import api from '../utils/api';
import { getTokenValue } from '../services/user_service';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatAccounting2 } from '../pages/hospitalpayment/HospitalPayment';
import CategoryCheckboxList from './CategoryCheckboxList';
import ReceiptModal from '../pages/hospitalpayment/ReceiptModal';
import { generatePDF } from '../pages/hospitalpayment/HospitalPayment';
import PatientTransactionsModal from './PatientTransactionsModal';
import CancelConfirm from './CancelConfirm';
import { CarCrash, Refresh } from '@mui/icons-material';

const tokenvalue = getTokenValue();

const icons = {
	Cash: <LocalAtmIcon />,
	CBHI: <VolunteerActivismIcon />,
	Credit: <CreditScoreIcon />,
	'Free of Charge': <MonetizationOnIcon />,
	Digital: <AttachMoneyIcon />,
	Traffic: <CarCrash />,
};

//const creditOrganizations = ["Tsedey Bank", "Amhara Bank", "Ethio Telecom"]; // example list
const initialState = {
	// cbhiId: "",
	method: '',
	digitalChannel: '',
	trxref: '',
	organization: '',
	employeeId: '',
};

function PaymentManagement() {
	const [rows, setRows] = useState([]);
	const [openModal, setOpenModal] = useState(false);
	const [selectedRow, setSelectedRow] = useState(null);
	const [paymentOptions, setPaymentOptions] = useState([]);
	const [digitalChannels, setDigitalChannels] = useState([]);
	const [formData, setFormData] = useState(initialState);
	const [trxRefError, settrxRefError] = useState('');
	const [formDataError, setFormDataError] = useState(initialState);
	const [creditOrganizations, setcreditOrganizations] = useState([]);
	const [totals, setTotals] = useState({});
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(false);
	const [refresh, setRefresh] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [receiptOpen, setReceiptOpen] = useState(false);
	const [receiptData, setReceiptData] = useState(null);
	const [isPrintLoading, setIsPrintLoading] = useState(false);
	const [openDetail, setOpenDetail] = useState(false);
	const [detailData, setDetailData] = useState([]);
	const [openConfirm, setOpenConfirm] = useState(false);
	const [cancelLoad, setCancelLoad] = useState(false);
	const navigate = useNavigate();

	const theme = useTheme();
	const colors = tokens(theme.palette.mode);

	//Fetch Organization with agreement
	useEffect(() => {
		const fetchORG = async () => {
			try {
				const response = await api.get(`/Organiztion/Organization`);
				if (response?.status === 200 || response?.status === 201) {
					setcreditOrganizations(response?.data?.map((item) => item.organization));
				}
			} catch (error) {
				console.error(error.message);
			}
		};
		fetchORG();
	}, []);

	//All Payments by casher
	useEffect(() => {
		const fetchPaymetInfo = async () => {
			try {
				const response = await api.put('/Payment/payment-by-cashier', tokenvalue.name, {
					headers: {
						'Content-Type': 'application/json',
					},
				});
				if (response.status === 200) {
					const sortedPayment = await response?.data.sort((a, b) => b.id - a.id);
					updatePaymentSummary(sortedPayment);
				}
			} catch (error) {
				console.error(error);
			}
		};
		fetchPaymetInfo();
	}, [refresh]);

	const updatePaymentSummary = (payments) => {
		const summary = payments.reduce((acc, payment) => {
			const { paymentType, paymentAmount } = payment;

			if (!acc[paymentType]) {
				acc[paymentType] = 0;
			}
			acc[paymentType] += parseFloat(paymentAmount);
			return acc;
		}, {});

		setTotals(summary);
		setTotal(Object.values(summary).reduce((a, b) => a + b, 0));
	};

	// Fetch Payment Options
	useEffect(() => {
		const fetchMeth = async () => {
			try {
				const response = await api.get('/Lookup/payment-type');
				if (response?.status === 200) {
					setPaymentOptions(response?.data?.filter((item) => item.type !== 'ALL').map((item) => item.type));
				}
			} catch (error) {
				console.error(error.message);
			}
		};
		fetchMeth();
	}, []);

	//fetch Digital Channels
	useEffect(() => {
		const fetchChane = async () => {
			try {
				const response = await api.get('/Lookup/payment-channel');
				if (response?.status === 200) {
					setDigitalChannels(response?.data?.map((item) => item.channel));
				}
			} catch (error) {
				console.error(error.message);
			}
		};
		fetchChane();
	}, []);

	const handleConfClose = () => {
		setOpenConfirm(false);
		setSelectedRow(null);
	};

	const handleCancel = async (confirm) => {
		try {
			if (confirm.message === 'Yes Please!') {
				setCancelLoad(true);
				const results = await Promise.allSettled(
					confirm?.selectedPayload?.map((item) =>
						api.delete('/Patient/cancel-patient-request', {
							data: {
								patientCardNumber: item.patientCardNumber,
								groupID: item.groupID,
								purpose: item.purpose,
							},
						})
					)
				);

				results.forEach((result, index) => {
					if (result.status === 'fulfilled' && result?.value?.status === 200) {
						const msg = result.value.data?.msg || 'Success';
						const purpose = JSON.parse(result?.value?.config?.data)?.purpose || 'Unknown';
						toast.success(`✅ Success ${index + 1}: ${msg} (Purpose: ${purpose})`);
						setRefresh((prev) => !prev);
						setCancelLoad(false);
						handleConfClose();
					} else {
						const errorMsg =
							result?.reason?.response?.data?.msg || result?.reason?.message || 'Unknown error occurred';
						toast.error(`❌ Failed ${index + 1}: ${errorMsg}`);
						setCancelLoad(false);
					}
				});
			} else {
				setSelectedRow(confirm);
				setOpenConfirm(true);
			}
		} catch (error) {
			console.error('This is canceling Payment error: ', error);
		}
	};

	const handleChange = (e) => {
		if (e.target.name === 'method') {
			setFormData({
				...formData,
				method: e.target.value,
				digitalChannel: '',
				trxref: '',
				organization: '',
				employeeId: '',
			});

			setFormDataError({
				...formDataError,
				method: '',
				digitalChannel: '',
				trxref: '',
				organization: '',
				employeeId: '',
			});
		} else {
			if (e.target.name === 'trxref') {
				validateTransactionRef(e.target.value);
			}
			setFormData({ ...formData, [e.target.name]: e.target.value });
			setFormDataError({ ...formDataError, [e.target.name]: '' });
		}
	};

	const validateTransactionRef = (trxRef) => {
		const trxPattern = /^[A-Za-z0-9-_]{10,25}$/;

		if (!trxRef) {
			settrxRefError('Transaction reference is required');
		} else if (!trxPattern.test(trxRef)) {
			settrxRefError('Invalid format. Use 10-25 characters with letters, numbers, -, _');
		} else {
			settrxRefError('');
		}

		return;
	};

	const handleOpenModal = (row) => {
		try {
			setSelectedRow(row);
			setOpenModal(true);
		} catch (error) {
			console.error('This is The Open Modal error: ', error);
			toast.error('Unable to open.');
		}
	};

	const handleCloseModal = () => {
		setOpenModal(false);
		setFormData(initialState);
		setFormDataError(initialState);
		settrxRefError('');
		setSelectedRow(null);
	};

	const handleConfSave = async () => {
		try {
			const errorMessage = 'Please Fill this field';
			if (
				!formData.method ||
				(formData.method.toUpperCase().includes('DIGITAL') &&
					(!formData.digitalChannel || !formData.trxref || !!trxRefError)) ||
				(formData.method.toUpperCase().includes('CREDIT') && (!formData.organization || !formData.employeeId))
			) {
				if (!formData.method) {
					setFormDataError((prev) => ({ ...prev, method: errorMessage }));
				}

				if (
					formData.method.toUpperCase().includes('DIGITAL') &&
					(!formData.digitalChannel || !formData.trxref)
				) {
					if (!formData.digitalChannel) {
						setFormDataError((prev) => ({
							...prev,
							digitalChannel: errorMessage,
						}));
					}

					if (!formData.trxref) {
						setFormDataError((prev) => ({
							...prev,
							trxref: errorMessage,
						}));
					}
				}

				if (
					formData.method.toUpperCase().includes('CREDIT') &&
					(!formData.organization || !formData.employeeId)
				) {
					if (!formData.organization) {
						setFormDataError((prev) => ({
							...prev,
							organization: errorMessage,
						}));
					}

					if (!formData.employeeId) {
						setFormDataError((prev) => ({
							...prev,
							employeeId: errorMessage,
						}));
					}
				}
				toast.error('Please Fill All Fields.');
				return;
			}

			if (!selectedRow.requestedCatagories.map((item) => item.isPaid).some((isPaid) => isPaid === true)) {
				toast.error('Should have at least one payment.');
				return;
			}

			const totalPaidAmount = selectedRow?.requestedCatagories
				?.filter((item) => item.isPaid === true)
				?.reduce((sum, item) => sum + (item.amount || 0), 0);

			if (totalPaidAmount <= 0) {
				toast.error('Should have Total Amount Greater than zero (0).');
				return;
			}

			const checkData = {
				cardNumber: selectedRow?.patientCardNumber,
				amount: selectedRow?.requestedCatagories?.filter((item) => item.isPaid === true),
				method: formData?.method,
				reason: selectedRow?.requestedCatagories
					?.filter((item) => item.isPaid === true)
					?.map((item) => item.purpose),
				description: '-',
			};

			setReceiptOpen(true);
			setReceiptData(checkData || []);
		} catch (error) {
			console.error('This is Handle Confirm Error: ', error);
			toast.error('Internal Server Error.');
		}
	};
	const handleSave = async () => {
		try {
			setLoading(true);
			setIsPrintLoading(true);

			const payload = {
				paymentType: formData?.method,
				cardNumber: selectedRow?.patientCardNumber,
				amount: selectedRow?.requestedCatagories,
				description: '-',
				createdby: tokenvalue?.name,
				channel: formData.digitalChannel || '-',
				paymentVerifingID: formData.trxref || '-',
				patientWorkID: formData.employeeId || '-',
				organization: formData?.organization || '-',
				groupID: '-',
			};

			const response = await api.post('/Payment/add-payment', payload, {
				headers: {
					'Content-Type': 'application/json',
				},
			});
			if (response?.data?.refNo?.length > 0) {
				toast.success(`Payment Regitstered Under ${response?.data?.refNo}`);
				setRefresh((prev) => !prev);
				const data = {
					method: formData.method || '',
					amount: selectedRow?.requestedCatagories?.filter((item) => item.isPaid === true) || '',
					patientName: selectedRow?.patientFName || '',
					cardNumber: selectedRow?.patientCardNumber || '',
					digitalChannel: formData?.digitalChannel || '',
					trxref: formData?.trxref || '',
					organization: formData?.organization || '',
					employeeId: formData?.employeeId || '',
					cbhiId: response?.data?.data?.map((item) => item.patientCBHI_ID)[0],
					refNo: response?.data?.refNo || '-',
				};

				await generatePDF(data);
				setIsPrintLoading(false);
				setReceiptData(null);
				handleCloseModal();
			}
		} catch (error) {
			console.error('This is Error on handle Save: ', error);
			toast.error(error?.response?.data?.msg || 'Internal Server Error.');
		} finally {
			setLoading(false);
			setIsPrintLoading(false);
			setReceiptOpen(false);
		}
	};

	const columns = [
		{ field: 'patientCardNumber', headerName: 'Card Number', flex: 1 },
		{ field: 'patientFName', headerName: 'First Name', flex: 1 },
		{ field: 'patientGender', headerName: 'Gender', flex: 1 },
		{
			field: 'noRequestedServices',
			headerName: 'No of Requested Services',
			flex: 1,
		},
		{
			field: 'requestedCatagories',
			headerName: 'Reason',
			flex: 1,
			renderCell: (params) => {
				try {
					return params.row.requestedCatagories.map((item) => item.purpose).join(', ');
				} catch (error) {
					console.error('Error Occured on rendering: ', error);
				}
			},
		},
		{
			field: 'totalPrice',
			headerName: 'Amount',
			flex: 1,
			renderCell: (params) => {
				try {
					return formatAccounting2(params.row.totalPrice);
				} catch (error) {
					console.error('Error Occured on rendering: ', error);
				}
			},
		},
		{
			field: 'paid',
			headerName: 'Status',
			flex: 1,
			renderCell: (params) => {
				try {
					return params.row.paid ? 'Completed' : 'Pending';
				} catch (error) {
					console.error('Error Occured on rendering: ', error);
				}
			},
		},
		{
			field: 'createdOn',
			headerName: 'Date',
			flex: 1,
			renderCell: (params) => {
				try {
					const date = new Date(params.row.createdOn);
					return date.toISOString().split('T')[0];
				} catch (error) {
					console.error('Error Occured on rendering: ', error);
				}
			},
		},
		{
			field: 'action',
			headerName: 'Manage',
			flex: 1,
			renderCell: (params) => (
				<Button variant="contained" onClick={() => handleOpenModal(params.row)}>
					Manage
				</Button>
			),
		},
		{
			field: 'cancel',
			headerName: 'Cancel',
			flex: 1,
			renderCell: (params) => (
				<Button variant="outlined" color="error" onClick={() => handleCancel(params.row)}>
					Cancel
				</Button>
			),
		},
	];

	//Fetch DataGrid Data
	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				const response = await api.put('/Patient/get-patient-request-cashier', {
					loggedInUser: tokenvalue?.name,
				});
				const modData =
					response?.data?.length > 0
						? response?.data?.map(({ patientFirstName, patientMiddleName, patientLastName, ...rest }) => ({
								patientFName: patientFirstName + ' ' + patientMiddleName + ' ' + patientLastName,
								...rest,
						  }))
						: [];

				const ModDataID = modData.map((item, index) => {
					return {
						...item,
						id: index + 1,
					};
				});

				setRows(ModDataID || []);
			} catch (error) {
				console.error('This is Fetch Table Data Error: ', error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, [refresh]);

	const openNewTab = (id) => {
		window.open(`https://cs.bankofabyssinia.com/slip/?trx=${id}`, '_blank', 'noopener,noreferrer');
	};

	const generateAndOpenPDF = async (error) => {
		try {
			const responseData = error?.response?.data;

			// Check if response is a Blob (e.g., an actual PDF file)
			if (responseData instanceof Blob) {
				const blobUrl = URL.createObjectURL(responseData);
				window.open(blobUrl, '_blank');

				// Revoke the blob after a few seconds to free memory
				setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
				return;
			}

			// If it's not a Blob, try to extract message
			let message = 'Incorrect Receipt ID';
			if (responseData?.message) {
				message = String(responseData.message);
			}

			// Generate a simple PDF with the message using pdf-lib
			const pdfDoc = await PDFDocument.create();
			const page = pdfDoc.addPage([600, 400]);
			const { height } = page.getSize();

			page.drawText(message, {
				x: 50,
				y: height - 100,
				size: 16,
				color: rgb(0, 0, 0),
			});

			const pdfBytes = await pdfDoc.save();
			const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
			const pdfUrl = URL.createObjectURL(pdfBlob);

			window.open(pdfUrl, '_blank');
			setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000);
		} catch (err) {
			console.error('generateAndOpenPDF error:', err);
		}
	};

	const handleDoubleClick = (data) => {
		try {
			const services = data.row.rquestedServices || [];

			setOpenDetail(true);

			const dataToSet =
				services.length > 0
					? services.map((item, index) => ({
							id: index + 1,
							patientFName: data.row.patientFName,
							patientCardNumber: data.row.patientCardNumber,
							...item, // includes amount, service, catagory
					  }))
					: [];
			setDetailData(dataToSet);
		} catch (error) {
			console.error('Double-click error: ', error);
			toast.error('Unable to open Detail Data.');
		}
	};

	const handleDetailClose = () => {
		setOpenDetail(false);
		setDetailData([]);
	};

	const handleOpenPage = async () => {
		try {
			const receptId = formData?.trxref;

			let config = {};
			let url;
			if (
				formData.digitalChannel.toUpperCase().includes('CBE MOBILE BANKING') ||
				formData.digitalChannel.toUpperCase().includes('TELEBIRR')
			) {
				url = `/Lookup/payment-verify/${receptId}?channel=${formData?.digitalChannel.toUpperCase()}`;
				if (formData.digitalChannel.toUpperCase().includes('CBE MOBILE BANKING')) {
					config = { responseType: 'blob' };
				} else {
					config = {};
				}
			} else if (formData.digitalChannel.toUpperCase().includes('BANK OF ABYSSINIA')) {
				// url = `/Lookup/redirecttoboa?transactionId=${receptId}`;
				openNewTab(receptId);
				// <a href={`https://cs.bankofabyssinia.com/slip/?trx=${receptId}`} target="_blank">View Slip</a>
			}

			if (!formData.digitalChannel.toUpperCase().includes('BANK OF ABYSSINIA')) {
				const response = await api.get(url, config);

				if (formData.digitalChannel.toUpperCase().includes('TELEBIRR')) {
					const newTab = window.open();
					if (newTab) {
						const newTabDocument = newTab.document;

						// Create a root div
						const rootDiv = newTabDocument.createElement('div');
						rootDiv.id = 'root';
						newTabDocument.body.appendChild(rootDiv);

						// Render the component in the new tab
						const root = ReactDOM.createRoot(rootDiv);
						root.render(<RenderPDF html={response?.data} />);
					}
				} else if (formData.digitalChannel.toUpperCase().includes('CBE MOBILE BANKING')) {
					try {
						const pdfBlob = response?.data
							? new Blob([response?.data], {
									type: 'application/pdf',
							  })
							: new Blob('Unknown status received.');

						const pdfUrl = URL.createObjectURL(pdfBlob);
						window.open(pdfUrl, '_blank');
					} catch (error) {
						console.error('CBE Error: ', error);
					}
				}
			}
		} catch (error) {
			console.error(error);
			if (formData.digitalChannel.toUpperCase().includes('CBE MOBILE BANKING')) {
				await generateAndOpenPDF(error);
			}
		}
	};

	const normalizeText = (text) => {
		try {
			if (text.toLowerCase() === 'cash') {
				return 'Cash';
			} else if (text.toLowerCase() === 'cbhi') {
				return 'CBHI';
			} else if (text.toLowerCase() === 'credit') {
				return 'Credit';
			} else if (text.toLowerCase() === 'digital') {
				return 'Digital';
			} else if (text.toLowerCase() === 'free of charge') {
				return 'Free of Charge';
			} else if (text.toLowerCase() === 'traffic') {
				return 'Traffic';
			} else {
				return text;
			}
		} catch (error) {
			console.error('This is text Normalizig Error: ', error);
			return '';
		}
	};

	return (
		<Box p={3}>
			{/* 🔝 Summary */}
			<Typography variant="h5" gutterBottom>
				💰 Today's Payment Summary
			</Typography>
			<Grid container spacing={2} mb={3}>
				{Object.entries(totals).map(([method, amt]) => (
					<Grid item xs={12} sm={6} md={3} key={method}>
						<Card
							sx={{
								display: 'flex',
								alignItems: 'center',
								p: 2,
								boxShadow: 3,
								borderRadius: 3,
							}}
						>
							<Avatar sx={{ bgcolor: '#1976d2', mr: 2 }} variant="rounded">
								{icons[normalizeText(method)] || <PaymentIcon />}
							</Avatar>
							<Box>
								<Typography variant="subtitle2">{method}</Typography>
								<Typography variant="h6" fontWeight="bold">
									{formatAccounting2(amt)} Birr
								</Typography>
							</Box>
						</Card>
					</Grid>
				))}
				<Grid item xs={12}>
					<Paper
						elevation={3}
						sx={{
							p: 2,
							backgroundColor: theme.palette.mode === 'light' ? '#e3f2fd' : theme.palette.primary.dark,
							borderLeft: `5px solid ${ theme.palette.mode === 'light' ? '#1976d2' : theme.palette.text.primary}`,
							borderRadius: 2,
							mt: 1,
							color: theme.palette.text.primary, // ensure text color matches theme
						}}
					>
						<Typography variant="h6" fontWeight="bold">
							Total Received Today: {formatAccounting2(total)} Birr
						</Typography>
					</Paper>
				</Grid>
			</Grid>

			{/* 📋 Data Table */}
			<Grid container spacing={2} alignItems="center" mb={2}>
				<Grid item xs={8}>
					<Typography variant="h6">🕓 Pending Payments</Typography>
				</Grid>
				<Grid item xs={12} md={4} textAlign="right">
					<Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
						<Button variant="contained" color="success" onClick={() => navigate('/payments')}>
							Add Payment
						</Button>

						<Button
							variant="outlined"
							sx={{
								color: colors.grey[100],
								borderColor: colors.grey[100],
								'&:hover': {
									borderColor: colors.grey[300],
									color: colors.grey[300],
								},
							}}
							onClick={() => setRefresh((prev) => !prev)}
							disabled={isLoading}
						>
							{isLoading ? (
								<CircularProgress size={24} />
							) : (
								<Refresh
									sx={{
										transition: 'transform 0.5s',
										'&:hover': { transform: 'rotate(90deg)' },
									}}
								/>
							)}
						</Button>
					</Stack>
				</Grid>
				<Grid item xs={12}>
					<DataGrid
						rows={rows}
						// getRowId={(row) => row.patientCardNumber}
						loading={isLoading}
						columns={columns}
						onRowDoubleClick={handleDoubleClick}
					/>
				</Grid>
			</Grid>

			{/* 💳 Modal */}
			<Modal
				open={openModal}
				onClose={(event, reason) => {
					if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
						handleCloseModal();
					}
				}}
			>
				<Box
					sx={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						width: {
							xs: '90vw',
							sm: 500,
							md: 600,
							lg: 700,
						},
						maxWidth: '95vw',
						maxHeight: '90vh',
						bgcolor: 'background.paper',
						boxShadow: 24,
						borderRadius: 3,
						p: 4,
						overflowY: 'auto',
					}}
				>
					<Typography variant="h6" gutterBottom color="primary">
						Manage Payment for: {selectedRow?.patientFName}
					</Typography>

					<Card sx={{ mb: 2, p: 2 }}>
						<Typography variant="subtitle1">
							Card Number: <strong>{selectedRow?.patientCardNumber}</strong>
						</Typography>
						<Typography variant="subtitle1" color="text.secondary">
							Total Amount: {/* <strong>{formatAccounting2(selectedRow?.totalPrice)}</strong> */}
							<strong>
								{formatAccounting2(
									selectedRow?.requestedCatagories
										?.filter((item) => item.isPaid)
										.reduce((sum, item) => sum + item.amount, 0)
								)}
								&nbsp; Birr
							</strong>
						</Typography>
					</Card>

					{/* Categories (External Component) */}
					<CategoryCheckboxList selectedRow={selectedRow} setSelectedRow={setSelectedRow} />

					{/* Payment Method */}
					<FormControl
						fullWidth
						margin="normal"
						required
						error={!!formDataError?.method}
						helpertext={formDataError?.method}
					>
						<Select
							name="method"
							value={formData.method}
							onChange={handleChange}
							displayEmpty
							renderValue={(selected) =>
								selected ? (
									<Box sx={{ display: 'flex', alignItems: 'center' }}>
										{icons[normalizeText(selected)]}&nbsp;{selected}
									</Box>
								) : (
									<span style={{ color: '#888' }}>Select Payment Method...*</span>
								)
							}
						>
							<MenuItem disabled value="">
								<em>Select Payment Method...</em>
							</MenuItem>
							{paymentOptions.map((option) => (
								<MenuItem key={option} value={option}>
									{icons[normalizeText(option)]} &nbsp; {option}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					{/* Digital */}
					{formData.method === 'Digital' && (
						<>
							<FormControl
								fullWidth
								margin="normal"
								required
								error={!!formDataError?.digitalChannel}
								helpertext={formDataError?.digitalChannel}
							>
								<Select
									name="digitalChannel"
									value={formData.digitalChannel}
									onChange={handleChange}
									displayEmpty
									renderValue={(selected) =>
										selected ? (
											selected
										) : (
											<span style={{ color: '#888' }}>Select Digital Channel...</span>
										)
									}
								>
									<MenuItem disabled value="">
										<em>Select Digital Channel...</em>
									</MenuItem>
									{digitalChannels.map((channel) => (
										<MenuItem key={channel} value={channel}>
											{channel}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<TextField
								fullWidth
								name="trxref"
								label="Transaction Ref. No"
								value={formData.trxref}
								onChange={handleChange}
								margin="normal"
								InputProps={{
									endAdornment: (
										<InputAdornment position="end">
											<IconButton onClick={handleOpenPage} edge="end">
												<OpenInNewIcon />
											</IconButton>
										</InputAdornment>
									),
								}}
								error={trxRefError?.length > 0 ? !!trxRefError : !!formDataError?.trxref}
								helperText={trxRefError?.length > 0 ? trxRefError : formDataError?.trxref}
							/>
						</>
					)}

					{/* Credit */}
					{formData.method === 'Credit' && (
						<>
							<FormControl fullWidth margin="normal" required error={!!formDataError?.organization}>
								<Select
									name="organization"
									value={formData.organization}
									onChange={handleChange}
									displayEmpty
									renderValue={(selected) =>
										selected ? (
											selected
										) : (
											<span style={{ color: '#888' }}>Select Organization...</span>
										)
									}
								>
									<MenuItem disabled value="">
										<em>Select Organization...</em>
									</MenuItem>
									{creditOrganizations.map((org) => (
										<MenuItem key={org} value={org}>
											{org}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<TextField
								fullWidth
								name="employeeId"
								label="Employee ID"
								value={formData.employeeId}
								onChange={handleChange}
								margin="normal"
								required
								error={!!formDataError?.employeeId}
								helperText={formDataError?.employeeId}
							/>
						</>
					)}

					{/* Action Buttons */}
					<Grid container spacing={2} sx={{ mt: 2 }}>
						<Grid item xs={6}>
							<Button variant="contained" fullWidth color="secondary" onClick={() => handleCloseModal()}>
								Cancel
							</Button>
						</Grid>
						<Grid item xs={6}>
							<Button
								variant="contained"
								fullWidth
								color="primary"
								onClick={handleConfSave}
								disabled={loading}
								startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
							>
								{loading ? 'Processing...' : 'Confirm Payment'}
							</Button>
						</Grid>
					</Grid>
				</Box>
			</Modal>
			<ReceiptModal
				open={receiptOpen}
				onClose={() => {
					setReceiptOpen(false);
					setReceiptData(null);
				}}
				data={receiptData}
				onPrint={handleSave}
				onloading={isPrintLoading}
			/>
			<PatientTransactionsModal open={openDetail} onClose={handleDetailClose} rows={detailData} />
			<CancelConfirm
				isOpen={openConfirm}
				onClose={handleConfClose}
				onConfirm={handleCancel}
				userData={selectedRow}
				onloading={cancelLoad}
			/>
			<ToastContainer />
		</Box>
	);
}

export default PaymentManagement;
