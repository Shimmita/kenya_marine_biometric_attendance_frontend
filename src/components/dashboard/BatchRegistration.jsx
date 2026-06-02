import { CheckCircleRounded, CloudUpload, DeleteSweep, PeopleRounded } from '@mui/icons-material';
import {
    Alert, Box, Button,
    Card,
    CircularProgress, Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider, Fade,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Stack,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TextField,
    Tooltip,
    Typography
} from '@mui/material';
import Papa from 'papaparse';
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { registerBatchUsers } from '../auth/Register';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const BatchRegistration = ({ readOnly = false }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [formatDialogOpen, setFormatDialogOpen] = useState(false);
    const [batchResult, setBatchResult] = useState(null);

    const headersList = ['User ID', 'Type', 'Staff No', 'Full Name', 'Email', 'Phone', 'Station', 'Department', 'Gender'];

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

        return Object.keys(counts).map(key => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: counts[key]
        }));
    }, [data]);


    const processData = (rawData) => {
        const cleanRows = rawData.filter(row => row.length > 0 && row.some(cell => cell !== undefined && cell !== null && cell.toString().trim() !== ''));
        if (cleanRows.length < 2) {
            setError('File must have at least a header row and one data row.');
            setLoading(false);
            return;
        }

        const headers = cleanRows[0].map(h => h?.toString().replace(/^\uFEFF/, '').trim());
        if (!headersList.every(h => headers.includes(h))) {
            setError('Invalid format. Missing columns: ' + headersList.filter(h => !headers.includes(h)).join(', '));
            setLoading(false);
            return;
        }

        const processedData = cleanRows.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] || '';
            });
            return obj;
        });

        const allowedTypes = ['staff', 'employee', 'intern', 'attachee', 'attache'];
        const invalidTypeRow = processedData.find((row) => {
            const typeValue = row['Type']?.toString().trim().toLowerCase();
            return typeValue && !allowedTypes.includes(typeValue);
        });

        if (invalidTypeRow) {
            setError('Invalid Type value found. Only intern, attachee, (staff or employee) are allowed.');
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
        newData[index][field] = value;
        setData(newData);
    };

    const handleUpload = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const mappedData = data.map(row => ({
                employeeId: row['User ID'],
                staffNo: row['Staff No'],
                role: (row['Type']?.toLowerCase() === 'staff' || row['Type']?.toLowerCase() === 'employee')
                    ? 'employee'
                    : row['Type']?.toLowerCase().includes("attach") ? 'attachee' : row['Type']?.toLowerCase(),
                name: row['Full Name'],
                email: row['Email'],
                phone: row['Phone'],
                station: row['Station'],
                department: row['Department'],
                gender: row['Gender'],
            }));

            const result = await registerBatchUsers(mappedData);
            const count = result?.count || mappedData.length;
            const message = result?.message || `Successfully registered ${count} users!`;
            setSuccess(message);
            setBatchResult(result);
            setDialogOpen(true);
            setData([]);
        } catch (err) {
            const message =
                typeof err === 'string'
                    ? err
                    : err?.message || 'Failed to register users.';
            setError(message);
            setErrorDialogOpen(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', margin: 'auto' }}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3, bgcolor: '#fcfcfc' }}>
                <Typography variant="h5" fontWeight="600" gutterBottom>Batch User Registration</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Upload your table for batch user registration . You can edit information directly in the table before final submission.
                </Typography>

                <Box sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.20)' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={8}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Required upload format</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.7 }}>
                                Your Table must include these header columns in the first row:
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
                                {['User ID', 'Type', 'Staff No', 'Full Name', 'Email', 'Phone', 'Station', 'Department', 'Gender'].map(col => (
                                    <Box key={col} sx={{ px: 1.5, py: 0.6, borderRadius: '999px', bgcolor: 'rgba(15, 23, 42, 0.06)', color: '#0f172a', fontWeight: 700, fontSize: '0.82rem' }}>
                                        {col}
                                    </Box>
                                ))}
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                For interns, <strong>User ID</strong> should be the National ID number. For attachees, use university/college registration or admission number. For staff, use the organization-assigned User ID used to login to the staff section. <strong>Staff No</strong> may be left blank for interns and attachees. In the <strong>Type</strong> column enter only <em>intern</em>, <em>attachee</em>, (<em>staff</em> or <em>employee</em>).
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
                            <Button
                                variant="outlined"
                                onClick={() => setFormatDialogOpen(true)}
                                sx={{ textTransform: 'none', fontWeight: 700 }}
                            >
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
                                            <Typography variant="h4" fontWeight="bold">{stat.value}</Typography>
                                            <Typography variant="body2" color="textSecondary">{stat.name}s</Typography>
                                        </Card>
                                    </Grid>
                                ))}
                                <Grid item xs={6} sm={4}>
                                    <Card variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 3, bgcolor: 'primary.main', color: 'white' }}>
                                        <Typography variant="h4" fontWeight="bold">{data.length}</Typography>
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

                {error && <Fade in><Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert></Fade>}
                {success && <Fade in><Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert></Fade>}

                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ bgcolor: '#eef6ff', color: '#0f172a', fontWeight: 800, px: 4, py: 3 }}>
                        Batch Registration Complete
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
                                        { col: 'User ID', desc: 'Staff: assigned org User ID; Intern: National ID; Attachee: university/college registration number' },
                                        { col: 'Type', desc: 'intern / attachee / (staff or employee) (only these values are allowed)' },
                                        { col: 'Staff No', desc: 'Organization-issued staff number; leave blank for interns and attachees' },
                                        { col: 'Full Name', desc: 'Employee or intern full name' },
                                        { col: 'Email', desc: 'Valid email address' },
                                        { col: 'Phone', desc: 'Phone number in international or local format' },
                                        { col: 'Station', desc: 'Work location, branch or station assignment' },
                                        { col: 'Department', desc: 'Assigned department or team' },
                                        { col: 'Gender', desc: 'Gender identifier (e.g. Male, Female, Other)' },
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
                {
                    data.length > 0 && (
                        <Fade in>
                            <Box>
                                <TableContainer
                                    component={Paper}
                                    sx={{
                                        maxHeight: 500,
                                        mb: 3,
                                        borderRadius: 2,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                        // Custom "Invisible" Scrollbar Effect
                                        '&::-webkit-scrollbar': { width: '6px', height: '6px' },
                                        '&::-webkit-scrollbar-thumb': { backgroundColor: '#e0e0e0', borderRadius: '10px' },
                                        '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' }
                                    }}
                                >
                                    <Table stickyHeader size="medium">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', color: '#555', whiteSpace: 'nowrap', width: '60px' }}>
                                                    No.
                                                </TableCell>
                                                {headersList.map((header) => (
                                                    <TableCell
                                                        key={header}
                                                        sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', color: '#555', whiteSpace: 'nowrap' }}
                                                    >
                                                        {header}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.map((row, index) => (
                                                <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                    <TableCell sx={{ minWidth: 60, fontWeight: 700 }}>
                                                        {index + 1}
                                                    </TableCell>
                                                    {headersList.map(field => (
                                                        <TableCell key={field} sx={{ minWidth: 150 }}>
                                                            <TextField
                                                                variant="standard"
                                                                value={row[field]}
                                                                onChange={(e) => handleCellEdit(index, field, e.target.value)}
                                                                InputProps={{ disableUnderline: true, sx: { fontSize: '0.875rem' } }}
                                                                fullWidth
                                                            />
                                                        </TableCell>
                                                    ))}
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
                                        onClick={handleUpload}
                                        disabled={loading || readOnly}
                                        sx={{ borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 600, boxShadow: 3 }}
                                    >
                                        {loading ? 'Processing...' : `Register ${data.length} Users`}
                                    </Button>
                                </Box>
                            </Box>
                        </Fade>
                    )
                }
            </Paper >
        </Box >
    );
};

export default BatchRegistration;
