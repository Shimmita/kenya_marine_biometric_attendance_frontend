// Department Structure Content
import { Card, CardContent, Chip, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import coreDataDetails from '../CoreDataDetails';
const { colorPalette } = coreDataDetails
export  default function DepartmentStructureContent() {
    const departments = [
        { name: 'Infose', head: 'Dr. Jane Doe', members: 12, color: colorPalette.oceanBlue },
        { name: 'Networking', head: 'Prof. John Smith', members: 15, color: colorPalette.cyanFresh },
        { name: 'Data Science', head: 'Dr. Michael Chen', members: 10, color: colorPalette.seafoamGreen },
        { name: 'System Admn', head: 'Eng. Sarah Mwangi', members: 8, color: colorPalette.warmSand },
        { name: 'Software Development', head: 'Dr. Amina Hassan', members: 6, color: colorPalette.coralSunset }
    ];

    const team = [
        { name: 'Alice Wanjiru', role: 'Network Engineer', department: 'Networking', status: 'active' },
        { name: 'Brian Ochieng', role: 'Software Engineer', department: 'Software Development', status: 'active' },
        { name: 'Catherine Muthoni', role: 'Data Analyst', department: 'Data Science', status: 'leave' },
        { name: 'David Kamau', role: 'System Administrator', department: 'System Admn', status: 'active' }
    ];

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h6" fontWeight="800" color={colorPalette.deepNavy} sx={{ mb: 2 }}>Departments Overview</Typography>
                <Grid container spacing={2}>
                    {departments.map((dept, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={idx}>
                            <Card elevation={0} sx={{ borderRadius: 4, border: `2px solid ${dept.color}30`, bgcolor: `${dept.color}05`, p: 3 }}>
                                <Typography variant="h6" fontWeight="800" color={dept.color} sx={{ mb: 1 }}>{dept.name}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Head: {dept.head}</Typography>
                                <Chip label={`${dept.members} Members`} sx={{ bgcolor: dept.color, color: 'white', fontWeight: 700 }} />
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Grid>

            <Grid item xs={12}>
                <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${colorPalette.softGray}` }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="800" color={colorPalette.deepNavy} sx={{ mb: 3 }}>Team Members</Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {team.map((member, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell><Typography fontWeight={600}>{member.name}</Typography></TableCell>
                                            <TableCell>{member.role}</TableCell>
                                            <TableCell>{member.department}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={member.status}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: member.status === 'active' ? `${colorPalette.seafoamGreen}20` : `${colorPalette.warmSand}20`,
                                                        color: member.status === 'active' ? colorPalette.seafoamGreen : colorPalette.warmSand,
                                                        fontWeight: 600,
                                                        textTransform: 'capitalize'
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};
