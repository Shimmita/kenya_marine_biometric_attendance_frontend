import {
    Avatar,
    Box,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tooltip,
    Typography
} from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import React from "react";

export default function UserTable({
    users,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    onViewUser
}) {
    const pageCount = Math.max(1, Math.ceil(users.length / rowsPerPage));
    const safePage = Math.min(page, pageCount - 1);
    const visibleUsers = React.useMemo(
        () => users.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage),
        [safePage, rowsPerPage, users]
    );

    return (
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden" }}>
            <TableContainer sx={{ overflowX: "auto" }}>
                <Table stickyHeader sx={{ minWidth: 920, tableLayout: "fixed" }}>
                    <TableHead>
                        <TableRow>
                            {/* Set widths on header cells to distribute space */}
                            {/* <TableCell sx={{ width: 60 }}>Image</TableCell> */}
                            <TableCell sx={{ width: "10%" }}>UserID</TableCell>
                            {/* <TableCell sx={{ width: "10%" }}>StaffNo</TableCell> */}
                            <TableCell sx={{ width: "22%" }}>Name</TableCell>
                            <TableCell sx={{ width: "12%" }}>Role</TableCell>
                            <TableCell sx={{ width: "16%" }}>Department</TableCell>
                            <TableCell sx={{ width: "16%" }}>Station</TableCell>
                            <TableCell sx={{ width: "10%" }}>Status</TableCell>
                            <TableCell sx={{ width: 60, textAlign: "center" }}>View</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {visibleUsers.map((user) => (
                            <React.Fragment key={user._id}>
                                <TableRow hover>
                                    {/* <TableCell>
                                        <Avatar
                                            src={user.avatar}
                                            imgProps={{ loading: "lazy", decoding: "async" }}
                                            sx={{ width: 42, height: 42 }}
                                        >
                                            {user.name?.charAt(0)}
                                        </Avatar>
                                    </TableCell> */}
                                    <Tooltip arrow title={user.employeeId}>
                                        <TableCell>{user.employeeId || "--"}</TableCell>
                                    </Tooltip>
                                    {/* <Tooltip title={user.staffNo} arrow>
                                        <TableCell>{user.staffNo || "--"}</TableCell>
                                    </Tooltip> */}
                                    <TableCell>
                                        <Box>
                                            <Tooltip arrow title={user.name}>
                                                <Typography variant="body2" fontWeight={600} noWrap>
                                                    {user.name}
                                                </Typography>
                                            </Tooltip>
                                            <Tooltip arrow title={user.email}>
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                    {user.email}
                                                </Typography>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip arrow title={user.role}>
                                            <Typography variant="body2" noWrap>
                                                {user.role}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip arrow title={user.department}>
                                            <Typography variant="body2" noWrap>
                                                {user.department || "--"}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip arrow title={user.station}>
                                            <Typography variant="body2" noWrap>
                                                {user.station || "--"}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip arrow title={user.isAccountActive ? "Active" : "Inactive"}>
                                            <Typography
                                                variant="body2"
                                                noWrap
                                                sx={{
                                                    color: user.isAccountActive ? "success.main" : "error.main",
                                                    fontWeight: 500
                                                }}
                                            >
                                                {user.isAccountActive ? "Active" : "Inactive"}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="View User">
                                            <IconButton onClick={() => onViewUser(user)}>
                                                <VisibilityRoundedIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>

                                {/* Clock Outside Info – colSpan still 9 */}
                                {user.canClockOutside && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            sx={{ py: 1.25, px: 3, bgcolor: "action.hover" }}
                                        >
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    flexWrap: "wrap",
                                                    gap: 2,
                                                    py: 0.8,
                                                    px: 2,
                                                    borderLeft: "4px solid",
                                                    borderColor: "success.main",
                                                    borderRadius: 2,
                                                    bgcolor: "background.paper"
                                                }}
                                            >
                                                <Typography variant="caption" fontWeight={700} color="success.main">
                                                    Clock Outside Authorized
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    <strong>Reason:</strong>{" "}
                                                    {user.outsideClockingDetails?.reason}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    <strong>Authorized By:</strong>{" "}
                                                    {user.outsideClockingDetails?.authorizedBy}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    <strong>Valid:</strong>{" "}
                                                    {new Date(
                                                        user.outsideClockingDetails?.startDate
                                                    ).toLocaleDateString()}
                                                    {"  →  "}
                                                    {new Date(
                                                        user.outsideClockingDetails?.endDate
                                                    ).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div"
                page={safePage}
                count={users.length}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10, 50, 100]}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
            />
        </Paper>
    );
}