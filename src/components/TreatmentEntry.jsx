import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Grid,
	TextField,
	MenuItem,
	Button,
	FormControl,
	InputLabel,
	OutlinedInput,
	Chip,
	Card,
	CardContent,
	ListItemText,
	ListSubheader,
	Select,
	Checkbox,
	CircularProgress,
	Paper,
	Stack,
	useTheme,
} from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid } from '@mui/x-data-grid';
import api from '../utils/api';
import { useLang } from '../contexts/LangContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getTokenValue } from '../services/user_service';
import { Refresh } from '@mui/icons-material';
import { tokens } from '../theme';
import axios from "axios";

const tokenvalue = getTokenValue();

const treatmentCategories = ['Laboratory', 'X-ray/Ultrasound', 'Other'];

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;

/*NO AUTO‑FOCUS  – we also disable the menu’s “auto‑focus first item”  */
const MenuProps = {
	PaperProps: {
		style: {
			maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
			width: 250,
		},
	},
	/* This stops MUI from focusing the first <MenuItem> automatically */
	MenuListProps: {
		autoFocusItem: false,
	},
};
const initialState = {
	cardNumber: '',
	category: '',
	amount: [],
	reason: [],
};
const errorStates = {
	cardNumber: '',
	cardNumberSearch: '',
	fullNameSearch: '',
};
const TreatmentEntry = () => {
	const { language } = useLang();
	const theme = useTheme();
	const colors = tokens(theme.palette.mode);

	const [treatmentList, setTreatmentList] = useState([]);
	const [reasons, setReasons] = useState([]);
	const [fullReasons, setFullReasons] = useState([]);
	const [formData, setFormData] = useState(initialState);
	const [formDataError, setFormDataError] = useState(errorStates);
	const [searchText, setSearchText] = useState('');
	const [saveLoading, setSaveloading] = useState(false);
	const [loadingRowId, setLoadingRowId] = useState(null);

	const [refresh, setRefresh] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	//fetchData for the data grid
	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				const response = await api.put('/Patient/get-patient-request', {
					loggedInUser: tokenvalue?.name,
				});
				const datas =
					response?.data?.length > 0 ? response?.data.map((item, index) => ({ ...item, id: index + 1 })) : [];

				const ModData = datas?.map(({ patientFirstName, patientMiddleName, patientLastName, ...rest }) => ({
					patientFName: patientFirstName + ' ' + patientMiddleName + ' ' + patientLastName,
					...rest,
				}));

				setTreatmentList(ModData || []);
			} catch (error) {
				console.error('This is Fetch Table Data Error: ', error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, [refresh]);

	//List Searching Logic
	const handleSearchChange = (event) => {
		setSearchText(event.target.value);
	};

	const handleCancel = () => {
		setFormData(initialState);
		setFormDataError(errorStates);
	};

	const handleCheckboxChange = (event) => {
		try {
			const values = event.target.value;

			setFormData((prev) => {
				return {
					...prev,
					reason: values,
					amount: values.map((item) => ({
						purpose: item,
						Amount: fullReasons.filter((itm) => itm.purpose === item).map((item) => item.amount)[0],
					})),
				};
			});
		} catch (error) {
			console.error(error.message);
		}
	};

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const username = 'beki';
				const password = 'Beki1212';
				const credentials = btoa(username + ':' + password);
				const basicAuth = 'Basic ' + credentials;

				const response = await axios.get('/openmrs/ws/rest/v1/patient', {
					headers: {
						Authorization: basicAuth,
					},
					params: {
						identifier: '1234',
						searchType: 'card',
						v: 'full',
					},
				});

				console.log('This is Response : ', response);
			} catch (error) {
				console.error('This is the Error of User Get: ', error);
			}
		};

		fetchUserData();
	}, []);

	const handleSave = async () => {
		try {
			setSaveloading(true);
			if (formDataError.cardNumber.length > 0) {
				toast.error('Please fix the Card Number Error.');
				return;
			}

			if (formData?.reason.length > 0) {
				const response = await api.post('/Patient/add-patient-request', {
					patientCardNumber: formData?.cardNumber,
					requestedServices: fullReasons
						.filter((item) => formData?.reason?.includes(item.purpose))
						.map((item) => item.id),
					purpose: formData?.category,
					createdBy: tokenvalue?.name,
				});
				if (Object.values(response?.data)?.some((item) => item?.length > 0)) {
					toast.success('Request Registered Successfully.');
					setRefresh((prev) => !prev);
					setFormData(initialState);
				}
			}
		} catch (error) {
			console.error('This is Save Error: ', error);
			toast.error(error?.response?.data?.msg || 'Internal Server Error.');
		} finally {
			setSaveloading(false);
		}
	};

	//fetch Reasons
	useEffect(() => {
		const fetchReasons = async () => {
			try {
				const response = await api.get('/Lookup/payment-purpose');
				if (response?.status === 200) {
					setReasons(response?.data?.map((item) => item.purpose));
					setFullReasons(response?.data);
				}
			} catch (error) {
				console.error(error.message);
			}
		};
		fetchReasons();
	}, []);

	const filteredReason = searchText.trim()
		? reasons.filter((item) => item.toLowerCase().includes(searchText.trim().toLowerCase()))
		: reasons;

	const handleMarkDone = async (data) => {
		try {
			setLoadingRowId(data.id);

			const payload = {
				patientCardNumber: data?.patientCardNumber,
				groupID: data?.requestGroup,
				isComplete: true,
				loggedInUser: tokenvalue?.name,
			};
			const response = await api.put('/Patient/complete-patient-request', payload);
			if (response.status === 200) {
				toast.success(response?.data?.msg);
				setRefresh((prev) => !prev);
			}
		} catch (error) {
			console.error('This IS mark as done Error: ', error);
			toast.error(error?.response?.data?.msg || 'Internal Server Error.');
		} finally {
			setLoadingRowId(null);
		}
	};

	const columns = [
		{ field: 'patientCardNumber', headerName: 'Card Number', flex: 1 },
		{ field: 'patientFName', headerName: 'Patient Name', flex: 1 },
		{
			field: 'requestedReason',
			headerName: 'Category',
			flex: 1,
		},
		{
			field: 'totalPrice',
			headerName: 'Amount',
			flex: 1,
			renderCell: (params) => {
				try {
					return `ETB ${params?.row?.totalPrice}`;
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
					const status = params?.row?.paid;
					const result = status ? 'Paid' : 'Pending';
					return result;
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
					return params?.row?.createdOn.split('T')[0];
				} catch (error) {
					console.error('Error Occured on rendering: ', error);
				}
			},
		},
		{
			field: 'Action',
			headerName: 'Action',
			flex: 1,
			renderCell: (params) => {
				try {
					return params?.row?.paid ? (
						<Button
							variant="outlined"
							color="success"
							startIcon={<TaskAltIcon />}
							sx={{
								textTransform: 'none',
								borderRadius: 2,
								fontWeight: 600,
								'&:hover': { transform: 'scale(1.01)' },
							}}
							onClick={() => handleMarkDone(params.row)}
							disabled={loadingRowId === params.row.id}
						>
							{loadingRowId === params.row.id ? (
								<CircularProgress size={24} color="inherit" />
							) : (
								'Mark as Completed'
							)}
						</Button>
					) : null;
				} catch (error) {
					console.error('Error occurred on rendering: ', error);
					return null;
				}
			},
		},
	];

	const handleChange = (e) => {
		if (e.target.name === 'cardNumber') {
			mrnCheck(e.target.name, e.target.value);
		}
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const mrnCheck = (name, value) => {
		const comp = /^[0-9]{5,}$/;
		if (!comp.test(value) && value.length > 0) {
			setFormDataError((prev) => ({
				...prev,
				[name]: 'Please Insert Valid MRN, more than 5 digit only.',
			}));
		} else {
			setFormDataError((prev) => ({
				...prev,
				[name]: '',
			}));
		}
	};

	return (
		<Box p={4}>
			<Typography variant="h5" gutterBottom fontWeight="bold">
				Patient Treatment Entry
			</Typography>

			<Paper elevation={3} sx={{ p: 3, mb: 4 }}>
				<Grid container spacing={2}>
					<Grid item xs={12} sm={4}>
						<TextField
							fullWidth
							label="Card Number"
							name="cardNumber"
							value={formData?.cardNumber}
							onChange={handleChange}
							placeholder="Enter card number"
							error={!!formDataError?.cardNumber}
							helperText={formDataError?.cardNumber}
							InputLabelProps={{
								sx: {
									color: 'primary.neutral',
									'&.Mui-focused': {
										color: 'secondary.main',
									},
								},
							}}
						/>
					</Grid>

					<Grid item xs={12} sm={4}>
						<TextField
							select
							fullWidth
							label="Treatment Category"
							name="category"
							value={formData?.category}
							onChange={handleChange}
							InputLabelProps={{
								sx: {
									color: 'primary.neutral',
									'&.Mui-focused': {
										color: 'secondary.main',
									},
								},
							}}
						>
							{treatmentCategories.map((cat) => (
								<MenuItem key={cat} value={cat}>
									{cat}
								</MenuItem>
							))}
						</TextField>
					</Grid>

					<Grid item xs={12} sm={4}>
						<FormControl
							sx={{
								width: '100%',
								'& .MuiOutlinedInput-root': {
									borderRadius: '10px',

									'&:hover fieldset': {
										borderColor: 'info.main',
									},
									'&.Mui-focused fieldset': {
										borderColor: 'primary.main',
										boxShadow: '0px 0px 8px rgba(0, 0, 255, 0.2)',
									},
								},
							}}
						>
							<InputLabel
								id="demo-multiple-checkbox-label"
								sx={{
									color: 'primary.neutral',
									'&.Mui-focused': {
										color: 'secondary.main',
									},
								}}
							>
								{language === 'AMH' ? 'ምክንያት' : 'Select Treatment'}
							</InputLabel>

							<Select
								labelId="demo-multiple-checkbox-label"
								id="demo-multiple-checkbox"
								multiple
								fullWidth
								value={formData.reason}
								onChange={handleCheckboxChange}
								input={<OutlinedInput label={language === 'AMH' ? 'ምክንያት' : 'Select Reason*'} />}
								renderValue={(selected) => (
									<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
										{selected.map((value) => (
											<Chip
												key={value}
												label={value}
												onMouseDown={(e) => e.stopPropagation()} //Prevent Select toggle
												onDelete={(e) => {
													e.stopPropagation(); //Prevent Select toggle

													setFormData((prev) => {
														const current = prev.reason;
														const updatedReason = current.filter(
															(val) => !val.includes(value)
														);
														return {
															...prev,
															reason: updatedReason,
															amount: prev.amount.filter(
																(item) => item.purpose !== value
															),
														};
													});
												}}
											/>
										))}
									</Box>
								)}
								MenuProps={MenuProps}
							>
								{/* 🔍 Search bar inside the dropdown */}
								<ListSubheader>
									<TextField
										fullWidth
										size="small"
										placeholder="Search…"
										value={searchText}
										onChange={handleSearchChange}
										/* Prevent *all* key events from bubbling up to <Select> */
										inputProps={{
											onKeyDown: (e) => e.stopPropagation(),
											onKeyUp: (e) => e.stopPropagation(),
											onKeyPress: (e) => e.stopPropagation(),
										}}
										InputLabelProps={{
											sx: {
												color: 'primary.neutral',
												'&.Mui-focused': {
													color: 'secondary.main',
												},
											},
										}}
									/>
								</ListSubheader>

								{filteredReason.map((reason) => (
									<MenuItem key={reason} value={reason}>
										<Checkbox checked={formData?.reason?.includes(reason)} />
										<ListItemText primary={reason} />
									</MenuItem>
								))}

								{filteredReason.length === 0 && <MenuItem disabled>No results found</MenuItem>}
							</Select>
						</FormControl>
					</Grid>

					<Grid container spacing={3} marginLeft={2} marginTop={1}>
						{formData?.amount?.map((treatment, index) => (
							<Grid item xs={6} sm={6} md={3} key={treatment.purpose}>
								<Card
									sx={{
										backgroundColor:
											theme.palette.mode === 'light' ? '#f5f5f5' : colors.primary[400],
									}}
								>
									<CardContent>
										<Typography
											variant="h6"
											color={theme.palette.mode === 'light' ? 'primary' : colors.grey[100]}
										>
											{treatment.purpose}
										</Typography>
										<Typography
											variant="body2"
											color={theme.palette.mode === 'light' ? 'primary' : colors.grey[100]}
											sx={{ mt: 1 }}
										>
											Amount: {treatment.Amount} Birr
										</Typography>
									</CardContent>
								</Card>
							</Grid>
						))}
					</Grid>
					{formData?.reason?.length > 0 && (
						<Grid container justifyContent="center" marginTop={2}>
							<Grid item xs={12} sm={12} md={3}>
								<Card
									sx={{
										backgroundColor:
											theme.palette.mode === 'light' ? '#CECECE' : colors.primary[400],
									}}
								>
									<CardContent>
										<Typography variant="h5" color="#3E7C28" sx={{ mt: 1, fontWeight: 'bold' }}>
											Total Amount
										</Typography>
										<Typography
											variant="body2"
											color={theme.palette.mode === 'light' ? 'primary' : colors.grey[100]}
											sx={{ mt: 1, fontWeight: 'bold' }}
										>
											{formData?.amount?.reduce(
												(total, item) => total + parseFloat(item.Amount || 0),
												0
											)}{' '}
											Birr
										</Typography>
									</CardContent>
								</Card>
							</Grid>
						</Grid>
					)}

					<Grid item xs={12}>
						<Button
							variant="contained"
							sx={{
								backgroundColor: '#478594',
								color: 'white', // Added text color for better visibility
								px: 4,
								py: 1.5,
								fontWeight: 'bold',
								'&:hover': {
									backgroundColor: '#1f5459',
								},
							}}
							onClick={handleSave}
							disabled={
								!formData?.cardNumber || !formData?.category || !formData?.reason?.length > 0 //||
								// Object.values(formDataError).some((item) => item.length > 0)
							}
						>
							{saveLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Treatment'}
						</Button>
						<Button variant="outlined" color="error" sx={{ marginInline: '15px' }} onClick={handleCancel}>
							Cancel
						</Button>
					</Grid>
				</Grid>
			</Paper>

			<Typography variant="h6" gutterBottom fontWeight="bold">
				Treatment List
			</Typography>

			<Box mb={3} p={2} component={Paper} elevation={3} borderRadius={2}>
				<Grid container spacing={2} alignItems="center">
					<Grid item xs={12} md={5}>
						<Box
							sx={{
								height: '56px',
								border: '1px dashed rgba(0,0,0,0.23)',
								borderRadius: '4px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: 'rgba(0,0,0,0.6)',
								fontStyle: 'italic',
								paddingBottom: '71px',
							}}
						>
							{/* Placeholder */}
						</Box>
					</Grid>
					<Grid item xs={12} md={5}>
						<Box
							sx={{
								height: '56px',
								border: '1px dashed rgba(0,0,0,0.23)',
								borderRadius: '4px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: 'rgba(0,0,0,0.6)',
								fontStyle: 'italic',
								paddingBottom: '71px',
							}}
						>
							{/* Placeholder */}
						</Box>
					</Grid>
					<Grid item xs={12} md={2}>
						<Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
							<Button
								variant="contained"
								fullWidth
								color="primary"
								size="large"
								disabled
								startIcon={<SearchIcon />}
								sx={{
									height: '100%',
									borderRadius: 2,
									textTransform: 'none',
									fontWeight: 'bold',
								}}
							>
								Search
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
				</Grid>
			</Box>

			<Paper elevation={2} sx={{ height: 400 }}>
				<DataGrid rows={treatmentList} loading={isLoading} columns={columns} disableSelectionOnClick />
			</Paper>
			<ToastContainer />
		</Box>
	);
};

export default TreatmentEntry;
