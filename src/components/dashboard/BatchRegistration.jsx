import { CloudUpload, DeleteSweep, PeopleRounded } from '@mui/icons-material';
import {
    Alert, Box, Button,
    Card,
    CircularProgress, Divider, Fade,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
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

const BatchRegistration = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const headersList = ['User ID', 'Type', 'Staff No', 'Full Name', 'Email', 'Phone', 'Station', 'Department', 'Gender'];

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setLoading(true);

        const fileExtension = file.name.split('.').pop().toLowerCase();
        const reader = new FileReader();

        reader.onload = (e) => {
            const binaryStr = e.target.result;
            let parsedData = [];

            try {
                if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                    const workbook = XLSX.read(binaryStr, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    setLoading(false);
                } else if (fileExtension === 'csv') {
                    Papa.parse(binaryStr, {
                        complete: (results) => processData(results.data),
                        header: false,
                    });
                    return;
                }
                processData(parsedData);
            } catch (err) {
                setError("Failed to parse file. Ensure it's a valid Excel or CSV.");
                setLoading(false);
            }
        };
        reader.readAsBinaryString(file);
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
        const cleanRows = rawData.filter(row => row.length > 0 && row.some(cell => cell !== ''));
        if (cleanRows.length < 2) {
            setError('File must have at least a header row and one data row.');
            return;
        }

        const headers = cleanRows[0].map(h => h?.toString().trim());
        if (!headersList.every(h => headers.includes(h))) {
            setError('Invalid format. Missing columns: ' + headersList.filter(h => !headers.includes(h)).join(', '));
            return;
        }

        const processedData = cleanRows.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] || '';
            });
            return obj;
        });

        setData(processedData);
        setError('');
        setSuccess('');
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

            result= await registerBatchUsers(mappedData);
            setSuccess(`Successfully registered ${data.length} users!`);
            setData([]);
        } catch (err) {
            setError(err || 'Failed to register users.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', margin: 'auto' }}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3, bgcolor: '#fcfcfc' }}>
                <Typography variant="h5" fontWeight="600" gutterBottom>Batch User Registration</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Upload your staff directory. You can edit information directly in the table before final submission.
                </Typography>

                

                <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                    {!data.length > 0 && <>
                        <input accept=".xlsx,.xls,.csv" style={{ display: 'none' }} id="file-upload" type="file" onChange={handleFileUpload} />
                        <label htmlFor="file-upload">
                            <Button
                                variant="outlined"
                                component="span"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <CloudUpload />}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                            >
                               {loading ? 'Uploading...' : 'Upload Excel/CSV'}
                            </Button>
                        </label>
                    </>}

                    {data.length > 0 && <Grid item xs={12} md={8}>
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
                    </Grid>}

                    {data.length > 0 && (
                        <Tooltip title="Clear table">
                            <IconButton onClick={() => setData([])} color="error">
                                <DeleteSweep />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

                {error && <Fade in><Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert></Fade>}
                {success && <Fade in><Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert></Fade>}

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
                                        disabled={loading}
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