import {
    ArrowBackIosRounded,
    ArrowForwardRounded,
    CheckCircleRounded,
    CloudUpload,
    DeleteSweep,
    PeopleRounded,
    PersonAdd
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Fade,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { motion as Motion } from 'framer-motion';
import Papa from 'papaparse';
import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import SuperadminAPI from '../../service/SuperadminService';
import { registerBatchUsers, registerStaff } from '../auth/Register';
import coreDataDetails, { applyPlatformConfigToCoreData } from '../CoreDataDetails';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const { colorPalette } = coreDataDetails;
const phoneRegex = /^254\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidPhone = (phone) => {
    if (!phone) return false;
    return phoneRegex.test(phone.toString().trim());
};

const isValidEmail = (email = '') => emailRegex.test(email.trim());

const normalizeStationOption = (station) => (typeof station === 'string' ? station : station?.name || '');

const uniqueOptions = (values = []) => [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];

const surfaceSx = {
    p: { xs: 2, sm: 3 },
    border: `1px solid ${colorPalette.oceanBlue}24`,
    borderRadius: 3,
    bgcolor: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(18px)',
    boxShadow: '0 18px 44px rgba(10,61,98,0.08)',
};

const fieldSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: '#fff',
        borderRadius: 2,
    },
    '& .MuiFormHelperText-root': {
        mx: 0,
        fontWeight: 600,
    },
};

const helperText = {
    employeeId: 'Enter Employee User ID.',
    staffNo: 'Enter employe staff number i.e KMF001.',
    fullName: 'Enter Employee official full name.',
    email: 'Enter a valid work email address.',
    phone: 'Enter phone number in the format 254...',
    station: 'Choose station for the employee.',
    department: 'Choose department for the employee.',
};

const initialSingleUser = {
    employeeId: '',
    type: '',
    staffNo: '',
    fullName: '',
    email: '',
    phone: '',
    station: '',
    department: '',
};

const BatchRegistration = ({ readOnly = false }) => {
    // ─── Mode selection ─────────────────────────────────────────────
    const [mode, setMode] = useState(null); // 'single' | 'batch' | null

    // ─── Batch state (unchanged) ────────────────────────────────────
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [formatDialogOpen, setFormatDialogOpen] = useState(false);
    const [batchResult, setBatchResult] = useState(null);

    // ─── Single staff state ─────────────────────────────────────────
    const [singleUser, setSingleUser] = useState(initialSingleUser);
    const [singleErrors, setSingleErrors] = useState({});
    const [singleLoading, setSingleLoading] = useState(false);
    const [singleSuccess, setSingleSuccess] = useState('');
    const [singleError, setSingleError] = useState('');
    const [configLoading, setConfigLoading] = useState(false);
    const [configError, setConfigError] = useState('');
    const [departments, setDepartments] = useState(() => uniqueOptions(coreDataDetails.availableDepartments));
    const [stations, setStations] = useState(() => uniqueOptions(coreDataDetails.AvailableStations.map(normalizeStationOption)));

    useEffect(() => {
        let mounted = true;

        const loadPlatformConfig = async () => {
            try {
                setConfigLoading(true);
                setConfigError('');
                const config = await SuperadminAPI.getPlatformConfig();
                applyPlatformConfigToCoreData(config);

                if (!mounted) return;
                setDepartments(uniqueOptions(config?.departments || coreDataDetails.availableDepartments));
                setStations(uniqueOptions((config?.stations || coreDataDetails.AvailableStations).map(normalizeStationOption)));
            } catch (err) {
                if (!mounted) return;
                console.error('Failed to load platform configuration', err);
                setConfigError('Using saved platform options because live configuration could not be loaded.');
                setDepartments(uniqueOptions(coreDataDetails.availableDepartments));
                setStations(uniqueOptions(coreDataDetails.AvailableStations.map(normalizeStationOption)));
            } finally {
                if (mounted) setConfigLoading(false);
            }
        };

        loadPlatformConfig();

        return () => {
            mounted = false;
        };
    }, []);

    // ─── Batch logic (unchanged) ────────────────────────────────────
    const headersList = ['User ID', 'Type', 'Staff No', 'Full Name', 'Email', 'Phone', 'Station', 'Department'];

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setError('');
        setSuccess('');
        setLoading(true);

        const fileExtension = file.name.split('.').pop().toLowerCase();
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                    const workbook = XLSX.read(e.target.result, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    processData(XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }));
                    return;
                }

                if (fileExtension === 'csv') {
                    Papa.parse(e.target.result, {
                        complete: (results) => {
                            processData(results.data);
                        },
                        error: () => {
                            setError("Failed to parse file. Ensure it's a valid CSV.");
                            setLoading(false);
                        },
                        header: false,
                        skipEmptyLines: true,
                    });
                    return;
                }

                setError('Unsupported file type. Upload an Excel or CSV file.');
                setLoading(false);
            } catch {
                setError("Failed to parse file. Ensure it's a valid Excel or CSV.");
                setLoading(false);
            }
        };

        reader.onerror = () => {
            setError('Failed to read file. Please try again.');
            setLoading(false);
        };

        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }

        event.target.value = '';
    };

    const stats = useMemo(() => {
        if (data.length === 0) return [];
        const counts = data.reduce((acc, curr) => {
            const type = curr['Type']?.toLowerCase() || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        return Object.keys(counts).map((key) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: counts[key],
        }));
    }, [data]);

    const invalidRows = useMemo(() => {
        return data.map((row) => ({
            phone: !isValidPhone(row.Phone),
            email: !isValidEmail(row.Email),
        }));
    }, [data]);

    const invalidPhoneRows = invalidRows.filter((r) => r.phone);
    const invalidEmailRows = invalidRows.filter((r) => r.email);
    const hasValidationErrors = invalidPhoneRows.length > 0 || invalidEmailRows.length > 0;

    const processData = (rawData) => {
        const cleanRows = rawData.filter((row) => row.length > 0 && row.some((cell) => cell !== undefined && cell !== null && cell.toString().trim() !== ''));
        if (cleanRows.length < 2) {
            setError('File must have at least a header row and one data row.');
            setLoading(false);
            return;
        }

        const headers = cleanRows[0].map((h) => h?.toString().replace(/^\uFEFF/, '').trim());
        if (!headersList.every((h) => headers.includes(h))) {
            setError('Invalid format. Missing columns: ' + headersList.filter((h) => !headers.includes(h)).join(', '));
            setLoading(false);
            return;
        }

        const processedData = cleanRows.slice(1).map((row) => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] || '';
            });
            return obj;
        });

        const allowedTypes = ['staff', 'employee'];
        const invalidTypeRow = processedData.find((row) => {
            const typeValue = row['Type']?.toString().trim().toLowerCase();
            return typeValue && !allowedTypes.includes(typeValue);
        });

        if (invalidTypeRow) {
            setError('Invalid Type value found. Only staff or employee values are allowed.');
            setLoading(false);
            return;
        }

        setData(processedData);
        setError('');
        setSuccess('');
        setLoading(false);
    };

    const handleCellEdit = (index, field, value) => {
        const newData = [...data];
        if (field === 'Phone') {
            value = value.replace(/\D/g, '');
            value = value.slice(0, 12);
        }
        newData[index] = {
            ...newData[index],
            [field]: value,
        };
        setData(newData);
    };

    const handleBatchUpload = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const mappedData = data.map((row) => ({
                employeeId: row['User ID'],
                staffNo: row['Staff No'],
                role: 'employee',
                name: row['Full Name'],
                email: row['Email'],
                phone: row['Phone'],
                station: row['Station'],
                department: row['Department'],
            }));

            const result = await registerBatchUsers(mappedData);
            const count = result?.count || mappedData.length;
            const message = result?.message || `Successfully registered ${count} ${count === 1 ? 'Employee' : 'Employees'}!`;
            setSuccess(message);
            setBatchResult(result);
            setDialogOpen(true);
            setData([]);
        } catch (err) {
            const message = typeof err === 'string' ? err : err?.message || 'Failed to register Employees.';
            setError(message);
            setErrorDialogOpen(true);
        } finally {
            setLoading(false);
        }
    };

    // ─── Single staff handlers ──────────────────────────────────────
    const validateSingleField = (field, rawValue = '') => {
        const value = String(rawValue || '').trim();

        if (field === 'employeeId' && !value) return 'User ID is required';
        if (field === 'staffNo' && !value) return 'Staff No is required';
        if (field === 'fullName' && !value) return 'Full Name is required';
        if (field === 'email') {
            if (!value) return 'Email is required';
            if (!isValidEmail(value)) return 'Enter a valid email address';
        }
        if (field === 'phone') {
            if (!value) return 'Phone is required';
            if (!isValidPhone(value)) return 'Must start with 254 followed by 9 digits';
        }
        if (field === 'station') {
            if (!value) return 'Station is required';
            if (stations.length && !stations.includes(value)) return 'Choose a configured station';
        }
        if (field === 'department') {
            if (!value) return 'Department is required';
            if (departments.length && !departments.includes(value)) return 'Choose a configured department';
        }

        return '';
    };

    const handleSingleChange = (field) => (e) => {
        const value = field === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 12) : e.target.value;
        setSingleUser((prev) => ({ ...prev, [field]: value }));
        setSingleErrors((prev) => ({ ...prev, [field]: validateSingleField(field, value) || undefined }));
        if (singleSuccess) setSingleSuccess('');
        if (singleError) setSingleError('');
    };

    const validateSingleForm = () => {
        const errors = {};
        const { employeeId, staffNo, fullName, email, phone, station, department } = singleUser;

        Object.entries({ employeeId, staffNo, fullName, email, phone, station, department }).forEach(([field, value]) => {
            const errorMessage = validateSingleField(field, value);
            if (errorMessage) errors[field] = errorMessage;
        });

        setSingleErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSingleRegister = async () => {
        if (!validateSingleForm()) return;

        setSingleLoading(true);
        setSingleError('');
        setSingleSuccess('');

        try {
            const formData = {
                name: singleUser.fullName,
                email: singleUser.email,
                phone: singleUser.phone,
                password: singleUser.password,
                role: "employee",
                department: singleUser.department,
                station: singleUser.station,
                employeeId: singleUser.employeeId,
                staffNo: singleUser.staffNo,
            };

            const result = await registerStaff({ formData });
            setSingleSuccess(result.message || 'Staff registered successfully!');
            // Reset form
            setSingleUser(initialSingleUser);
            setSingleErrors({});
        } catch (err) {
            const msg = typeof err === 'string' ? err : err?.message || 'Registration failed';
            setSingleError(msg);
        } finally {
            setSingleLoading(false);
        }
    };

    // ─── Render single form ─────────────────────────────────────────
    const renderSingleForm = () => (
        <Box sx={{ p: { xs: 1, md: 2 }, maxWidth: '1200px', margin: 'auto' }}>
            <Paper elevation={0} sx={surfaceSx}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} color={colorPalette.deepNavy} gutterBottom>
                            Single Staff Registration
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manually register one staff member at a time. Fields validate as you type.
                        </Typography>
                    </Box>
                    <Button startIcon={<ArrowBackIosRounded />} variant="outlined" onClick={() => setMode(null)} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, borderRadius: 2, textTransform: 'none', fontWeight: 800 }}>
                        Back
                    </Button>
                </Stack>

                {singleError && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSingleError('')}>
                        {singleError}
                    </Alert>
                )}
                {singleSuccess && (
                    <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSingleSuccess('')}>
                        {singleSuccess}
                    </Alert>
                )}
                {configError && (
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setConfigError('')}>
                        {configError}
                    </Alert>
                )}

                <Grid container spacing={2}>
                    {[
                        { label: 'User ID', field: 'employeeId', required: true },
                        { label: 'Staff No', field: 'staffNo', required: true },
                        { label: 'Full Name', field: 'fullName', required: true },
                        { label: 'Email', field: 'email', required: true, type: 'email' },
                        { label: 'Phone (254...)', field: 'phone', required: true },
                    ].map(({ label, field, required, type = 'text' }) => (
                        <Grid item xs={12} sm={6} key={field}>
                            <TextField
                                fullWidth
                                label={label}
                                value={singleUser[field]}
                                onChange={handleSingleChange(field)}
                                error={!!singleErrors[field]}
                                helperText={singleErrors[field] || helperText[field]}
                                required={required}
                                type={type}
                                variant="outlined"
                                size="small"
                                sx={fieldSx}
                                disabled={singleLoading}
                            />
                        </Grid>
                    ))}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            fullWidth
                            label="Station"
                            value={singleUser.station}
                            onChange={handleSingleChange('station')}
                            error={!!singleErrors.station}
                            helperText={singleErrors.station || helperText.station}
                            required
                            variant="outlined"
                            size="small"
                            sx={fieldSx}
                            disabled={singleLoading || configLoading}
                        >
                            {stations.map((station) => (
                                <MenuItem key={station} value={station}>
                                    {station}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            fullWidth
                            label="Department"
                            value={singleUser.department}
                            onChange={handleSingleChange('department')}
                            error={!!singleErrors.department}
                            helperText={singleErrors.department || helperText.department}
                            required
                            variant="outlined"
                            size="small"
                            sx={fieldSx}
                            disabled={singleLoading || configLoading}
                        >
                            {departments.map((department) => (
                                <MenuItem key={department} value={department}>
                                    {department}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={singleLoading ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
                        onClick={handleSingleRegister}
                        disabled={singleLoading || readOnly   }
                        sx={{ borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 800, boxShadow: '0 12px 28px rgba(10,61,98,0.22)', bgcolor: colorPalette.deepNavy }}
                    >
                        {singleLoading ? 'Registering...' : 'Register Staff'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );

    // ─── Main render ─────────────────────────────────────────────────
    // Show selection modal if mode not chosen
    if (mode === null) {
        return (

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ p: { xs: 1, md: 2 }, maxWidth: 1000, mx: 'auto' }}>
                <Motion.div
                    style={{ willChange: 'transform, opacity' }}
                    initial={{ opacity: 0, x: 32, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 24, scale: 0.97 }}
                    transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                >
                    <Card
                        variant="outlined"
                        sx={{
                            p: 3,
                            flex: 1,
                            cursor: 'pointer',
                            borderRadius: 3,
                            border: `1px solid ${colorPalette.oceanBlue}24`,
                            bgcolor: 'rgba(255,255,255,0.82)',
                            boxShadow: '0 18px 44px rgba(10,61,98,0.08)',
                            transition: '0.2s',
                            '&:hover': { borderColor: colorPalette.oceanBlue, bgcolor: 'rgba(255,255,255,0.94)' },
                        }}
                        onClick={() => setMode('single')}
                    >
                        <Stack alignItems="center" spacing={1}>
                            <PersonAdd sx={{ fontSize: 48, color: colorPalette.oceanBlue }} />
                            <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>
                                Single Staff
                            </Typography>
                            <Typography variant="body2" color="textSecondary" align="center">
                                Manually register individual staff one by one.
                            </Typography>
                            <Box display="flex" justifyContent="center" mt={2}>

                                <Button endIcon={<ArrowForwardRounded />} disableElevation sx={{ borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 800, color: colorPalette.oceanBlue }}>Continue</Button>
                            </Box>
                        </Stack>
                    </Card>
                </Motion.div>

                <Motion.div
                    style={{ willChange: 'transform, opacity' }}
                    initial={{ opacity: 0, x: 32, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 24, scale: 0.97 }}
                    transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                >
                    <Card
                        variant="outlined"
                        sx={{
                            p: 3,
                            flex: 1,
                            cursor: 'pointer',
                            borderRadius: 3,
                            border: `1px solid ${colorPalette.seafoamGreen}44`,
                            bgcolor: 'rgba(255,255,255,0.82)',
                            boxShadow: '0 18px 44px rgba(10,61,98,0.08)',
                            transition: '0.2s',
                            '&:hover': { borderColor: colorPalette.seafoamGreen, bgcolor: 'rgba(255,255,255,0.94)' },
                        }}
                        onClick={() => setMode('batch')}
                    >
                        <Stack alignItems="center" spacing={1}>
                            <PeopleRounded sx={{ fontSize: 48, color: colorPalette.seafoamGreen }} />
                            <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>
                                Batch Registration
                            </Typography>
                            <Typography variant="body2" color="textSecondary" align="center">
                                Upload an Excel file containing records of employees.
                            </Typography>
                            <Box display="flex" justifyContent="center" mt={2}>

                                <Button endIcon={<ArrowForwardRounded />} disableElevation sx={{ borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 800, color: colorPalette.seafoamGreen }}>Continue</Button>
                            </Box>
                        </Stack>
                    </Card>
                </Motion.div>

            </Stack>
        );
    }

    // Render based on selected mode
    if (mode === 'single') {
        return renderSingleForm();
    }

    // ─── Batch registration (original component) ────────────────────
    return (
        <Box sx={{ p: { xs: 1, md: 2 }, maxWidth: '1200px', margin: 'auto' }}>
            <Paper elevation={0} sx={surfaceSx}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} color={colorPalette.deepNavy} gutterBottom>
                            Batch User Registration
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Upload your table for batch user registration. You can edit information directly in the table before final submission.
                        </Typography>
                    </Box>
                    <Button variant="outlined" onClick={() => setMode(null)} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, borderRadius: 2, textTransform: 'none', fontWeight: 800 }}>
                        Back
                    </Button>
                </Stack>

                <Box sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.20)' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={8}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                Required upload format
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.7 }}>
                                Your Table must include these header columns in the first row:
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
                                {['User ID', 'Type', 'Staff No', 'Full Name', 'Email', 'Phone', 'Station', 'Department'].map((col) => (
                                    <Box
                                        key={col}
                                        sx={{ px: 1.5, py: 0.6, borderRadius: '999px', bgcolor: 'rgba(15, 23, 42, 0.06)', color: '#0f172a', fontWeight: 700, fontSize: '0.82rem' }}
                                    >
                                        {col}
                                    </Box>
                                ))}
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                For batch registration, only employee or staff accounts are accepted. <strong>User ID</strong> will be the one used to log in to the portal. In the <strong>Type</strong> column enter only <em>staff</em> or <em>employee</em>. The <strong>No.</strong> column will be automatically generated to count the number of employees, Therefore, do not include it in your table. <strong>Phone </strong>number must be in international format i.e 2547...
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1, flexWrap: 'wrap' }}>
                            <input accept=".xlsx,.xls,.csv" style={{ display: 'none' }} id="file-upload" type="file" onChange={handleFileUpload} />
                            <label htmlFor="file-upload">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <CloudUpload />}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                >
                                    {loading ? 'Uploading...' : 'Upload Excel or CSV'}
                                </Button>
                            </label>
                            <Button variant="outlined" onClick={() => setFormatDialogOpen(true)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                                View upload guide
                            </Button>
                        </Grid>
                    </Grid>
                </Box>

                {data.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>
                                {stats.map((stat, i) => (
                                    <Grid item xs={6} sm={4} key={stat.name}>
                                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 3, borderLeft: `5px solid ${COLORS[i % COLORS.length]}` }}>
                                            <Typography variant="h4" fontWeight="bold">
                                                {stat.value}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {stat.name}s
                                            </Typography>
                                        </Card>
                                    </Grid>
                                ))}
                                <Grid item xs={6} sm={4}>
                                    <Card variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 3, bgcolor: 'primary.main', color: 'white' }}>
                                        <Typography variant="h4" fontWeight="bold">
                                            {data.length}
                                        </Typography>
                                        <Typography variant="body2">Total Records</Typography>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Tooltip title="Clear table">
                            <IconButton onClick={() => setData([])} color="error">
                                <DeleteSweep />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}

                {error && (
                    <Fade in>
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    </Fade>
                )}
                {success && (
                    <Fade in>
                        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                            {success}
                        </Alert>
                    </Fade>
                )}

                {/* Dialogs for batch (unchanged) */}
                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ bgcolor: '#eef6ff', color: '#0f172a', fontWeight: 800, px: 4, py: 3 }}>
                        Staff Registration Complete
                    </DialogTitle>
                    <DialogContent dividers sx={{ p: 4, bgcolor: '#f8fbff' }}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                            <Box sx={{ width: 52, height: 52, borderRadius: 3, bgcolor: '#dbeafe', display: 'grid', placeItems: 'center' }}>
                                <CheckCircleRounded sx={{ color: '#2563eb', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight={900} color="#0f172a">
                                    {batchResult?.message || 'Users registered successfully'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {`Total registered: ${batchResult?.count || 0}`}
                                </Typography>
                            </Box>
                        </Stack>
                        {batchResult?.registeredUsers?.length ? (
                            <Box>
                                <Typography fontWeight={700} mb={2} color="#0f172a">
                                    Registered users
                                </Typography>
                                <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1, pb: 1 }}>
                                    {batchResult.registeredUsers.map((user, index) => (
                                        <Box key={user?.id || index} sx={{ mb: 1, p: 2, borderRadius: 3, bgcolor: '#ffffff', border: '1px solid rgba(59,130,246,0.12)' }}>
                                            <Typography variant="subtitle2" fontWeight={800} color="#1e3a8a">
                                                {user?.name || 'Unknown'}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        ) : null}
                    </DialogContent>
                    <DialogActions sx={{ px: 4, py: 3, bgcolor: '#f8fafc' }}>
                        <Button onClick={() => setDialogOpen(false)} variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={formatDialogOpen} onClose={() => setFormatDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ bgcolor: '#eff6ff', color: '#0f172a', fontWeight: 800, px: 4, py: 3 }}>
                        Batch Upload Format Guide
                    </DialogTitle>
                    <DialogContent dividers sx={{ p: 4, bgcolor: '#f8fbff' }}>
                        <Typography variant="body1" fontWeight={700} sx={{ mb: 2 }}>
                            Required columns for Excel/CSV upload
                        </Typography>
                        {hasValidationErrors && (
                            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                                {invalidPhoneRows.length > 0 && `${invalidPhoneRows.length} invalid phone number(s). `}
                                {invalidEmailRows.length > 0 && `${invalidEmailRows.length} invalid email address(es). `}
                                Correct all highlighted fields before registration.
                            </Alert>
                        )}
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, boxShadow: 'none' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {['Column', 'Description'].map((col) => (
                                            <TableCell key={col} sx={{ bgcolor: '#e0f2fe', fontWeight: 800, color: '#0c4a6e' }}>
                                                {col}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {[
                                        { col: 'User ID', desc: 'Staff assigned org User ID' },
                                        { col: 'Type', desc: 'Staff / Employee only' },
                                        { col: 'Staff No', desc: 'Organization-issued staff number i.e KMF001' },
                                        { col: 'Full Name', desc: 'Employee or Staff Full Name' },
                                        { col: 'Email', desc: 'Valid email address' },
                                        { col: 'Phone', desc: 'Phone number in international format i.e 2547...' },
                                        { col: 'Station', desc: 'Work station assignment' },
                                        { col: 'Department', desc: 'Assigned department' },
                                    ].map((row) => (
                                        <TableRow key={row.col}>
                                            <TableCell sx={{ fontWeight: 700 }}>{row.col}</TableCell>
                                            <TableCell>{row.desc}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            The file header must exactly include these columns in the first row. Any missing required column will prevent upload. Make sure the file is formatted as a valid Excel or CSV file before choosing it.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 4, py: 3, bgcolor: '#eff6ff' }}>
                        <Button onClick={() => setFormatDialogOpen(false)} variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>
                            Got it
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={errorDialogOpen} onClose={() => setErrorDialogOpen(false)} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ bgcolor: '#fef2f2', color: '#991b1b', fontWeight: 800, px: 4, py: 3 }}>
                        Registration Error
                    </DialogTitle>
                    <DialogContent dividers sx={{ p: 4, bgcolor: '#fff1f2' }}>
                        <Typography variant="body1" color="#991b1b" sx={{ mb: 2 }}>
                            {error || 'An unexpected error occurred while registering users.'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Please fix the issue and try again. If the problem persists, contact your administrator.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 4, py: 3, bgcolor: '#fef2f2' }}>
                        <Button onClick={() => setErrorDialogOpen(false)} variant="contained" color="error" sx={{ textTransform: 'none', fontWeight: 700 }}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                {data.length > 0 && <Divider />}
                {data.length > 0 && (
                    <Fade in>
                        <Box>
                            {hasValidationErrors && (
                                <Alert
                                    severity="warning"
                                    sx={{
                                        mb: 2,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(245,158,11,0.08)',
                                        border: '1px solid rgba(245,158,11,0.25)',
                                    }}
                                >
                                    {invalidPhoneRows.length} record {invalidPhoneRows.length > 1 ? 's' : ''} contain invalid phone numbers. All phone numbers must begin with <strong> 254 </strong> before registration can continue.
                                </Alert>
                            )}
                            <TableContainer
                                component={Paper}
                                sx={{
                                    maxHeight: 500,
                                    mb: 3,
                                    borderRadius: 2,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    '&::-webkit-scrollbar': { width: '6px', height: '6px' },
                                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#e0e0e0', borderRadius: '10px' },
                                    '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
                                }}
                            >
                                <Table stickyHeader size="medium">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', color: '#555', whiteSpace: 'nowrap', width: '60px' }}>
                                                No.
                                            </TableCell>
                                            {headersList.map((header) => (
                                                <TableCell key={header} sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', color: '#555', whiteSpace: 'nowrap' }}>
                                                    {header}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.map((row, index) => (
                                            <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell sx={{ minWidth: 60, fontWeight: 700 }}>{index + 1}</TableCell>
                                                {headersList.map((field) => {
                                                    const invalidPhone = field === 'Phone' && !isValidPhone(row.Phone);
                                                    const invalidEmail = field === 'Email' && !isValidEmail(row.Email);
                                                    const hasError = invalidPhone || invalidEmail;
                                                    return (
                                                        <TableCell
                                                            key={field}
                                                            sx={{
                                                                minWidth: 150,
                                                                bgcolor: invalidPhone ? 'rgba(245,158,11,0.08)' : 'transparent',
                                                                transition: '0.2s',
                                                            }}
                                                        >
                                                            <Box>
                                                                {invalidPhone && (
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{ display: 'block', color: '#b45309', fontSize: '0.65rem', fontWeight: 700, mb: 0.4 }}
                                                                    >
                                                                        Begin with 254 e.g. 254712345678
                                                                    </Typography>
                                                                )}
                                                                {invalidEmail && (
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{ display: 'block', color: '#b45309', fontSize: '0.65rem', fontWeight: 700, mb: 0.4 }}
                                                                    >
                                                                        Invalid email format
                                                                    </Typography>
                                                                )}
                                                                <TextField
                                                                    variant="standard"
                                                                    value={row[field]}
                                                                    onChange={(e) => handleCellEdit(index, field, e.target.value)}
                                                                    error={hasError}
                                                                    fullWidth
                                                                    InputProps={{
                                                                        disableUnderline: true,
                                                                        sx: {
                                                                            fontSize: '0.875rem',
                                                                            px: 1,
                                                                            py: 0.6,
                                                                            borderRadius: 1,
                                                                            bgcolor: hasError ? 'rgba(245,158,11,.12)' : 'transparent',
                                                                            transition: '.2s',
                                                                        },
                                                                    }}
                                                                />
                                                            </Box>
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PeopleRounded />}
                                    onClick={handleBatchUpload}
                                    disabled={loading || readOnly || hasValidationErrors}
                                    sx={{ borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 600, boxShadow: 3 }}
                                >
                                    {loading ? 'Processing...' : `Register ${data.length} Employees`}
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                )}
            </Paper>
        </Box>
    );
};

export default BatchRegistration;
