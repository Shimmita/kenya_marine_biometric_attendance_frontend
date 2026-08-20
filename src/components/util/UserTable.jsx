import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import {
    Avatar,
    Box,
    Chip,
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
    Typography,
} from "@mui/material";
import React from "react";

const T = {
    ink: "#172033",
    muted: "#687386",
    line: "rgba(15, 23, 42, 0.08)",
    blue: "#1167E8",
    green: "#16A34A",
    red: "#DC2626",
    cardShadow: "0 10px 26px rgba(15, 23, 42, 0.08)",
};

const avatarColors = ["#DBEAFE", "#F3E8FF", "#FEF3C7", "#E0F2FE", "#DCFCE7", "#FFE4E6"];

const formatName = (value) =>
    String(value || "Unknown").replace(/\b\w/g, (char) => char.toUpperCase());

const roleChipSx = (role) => {
    const normalized = String(role || "").toLowerCase();
    const isEmployee = normalized === "employee";
    return {
        height: 23,
        borderRadius: "6px",
        bgcolor: isEmployee ? "rgba(22,163,74,0.10)" : "rgba(17,103,232,0.10)",
        color: isEmployee ? T.green : T.blue,
        fontSize: 11,
        fontWeight: 900,
        border: `1px solid ${isEmployee ? "rgba(22,163,74,0.18)" : "rgba(17,103,232,0.18)"}`,
    };
};

export default function UserTable({
    users,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    onViewUser,
}) {
    const pageCount = Math.max(1, Math.ceil(users.length / rowsPerPage));
    const safePage = Math.min(page, pageCount - 1);
    const visibleUsers = React.useMemo(
        () => users.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage),
        [safePage, rowsPerPage, users]
    );

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: "8px",
                overflow: "hidden",
                border: `1px solid ${T.line}`,
                boxShadow: T.cardShadow,
                bgcolor: "#FFFFFF",
            }}
        >
            <TableContainer sx={{ overflowX: "auto", p: 1 }}>
                <Table stickyHeader sx={{ minWidth: 980, tableLayout: "fixed" }}>
                    <TableHead>
                        <TableRow>
                            {[
                                ["Staff No", "10%"],
                                ["Name", "24%"],
                                ["Role", "12%"],
                                ["Department", "21%"],
                                ["Station", "18%"],
                                ["Status", "10%"],
                                ["Actions", 92],
                            ].map(([label, width]) => (
                                <TableCell
                                    key={label}
                                    sx={{
                                        width,
                                        borderBottom: `1px solid ${T.line}`,
                                        bgcolor: "#FFFFFF",
                                        color: T.muted,
                                        fontSize: 12,
                                        fontWeight: 900,
                                        py: 1.8,
                                        textAlign: label === "Actions" ? "center" : "left",
                                    }}
                                >
                                    {label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {visibleUsers.map((user, index) => (
                            <React.Fragment key={user._id}>
                                <TableRow hover sx={{ "&:hover": { bgcolor: "rgba(17,103,232,0.025)" } }}>
                                    <Tooltip arrow title={user.employeeId || ""}>
                                        <TableCell sx={{ py: 1.6, borderBottom: `1px solid ${T.line}`, color: T.ink, fontWeight: 800, fontSize: 13 }}>
                                            {user.employeeId || "--"}
                                        </TableCell>
                                    </Tooltip>

                                    <TableCell sx={{ py: 1.6, borderBottom: `1px solid ${T.line}` }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.4, minWidth: 0 }}>
                                            <Avatar
                                                src={user.avatar}
                                                imgProps={{ loading: "lazy", decoding: "async" }}
                                                sx={{
                                                    width: 38,
                                                    height: 38,
                                                    bgcolor: avatarColors[index % avatarColors.length],
                                                    color: T.blue,
                                                    fontSize: 16,
                                                    fontWeight: 900,
                                                }}
                                            >
                                                {formatName(user.name).charAt(0)}
                                            </Avatar>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Tooltip arrow title={user.name || ""}>
                                                    <Typography sx={{ color: T.ink, fontSize: 13, fontWeight: 900 }} noWrap>
                                                        {formatName(user.name)}
                                                    </Typography>
                                                </Tooltip>
                                                <Tooltip arrow title={user.email || ""}>
                                                    <Typography sx={{ color: T.muted, fontSize: 12, fontWeight: 700 }} noWrap>
                                                        {user.email}
                                                    </Typography>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    <TableCell sx={{ py: 1.6, borderBottom: `1px solid ${T.line}` }}>
                                        <Tooltip arrow title={user.role || ""}>
                                            <Chip size="small" label={formatName(user.role)} sx={roleChipSx(user.role)} />
                                        </Tooltip>
                                    </TableCell>

                                    <TableCell sx={{ py: 1.6, borderBottom: `1px solid ${T.line}` }}>
                                        <Tooltip arrow title={user.department || ""}>
                                            <Typography sx={{ color: T.ink, fontSize: 13, fontWeight: 800 }} noWrap>
                                                {user.department || "--"}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>

                                    <TableCell sx={{ py: 1.6, borderBottom: `1px solid ${T.line}` }}>
                                        <Tooltip arrow title={user.station || ""}>
                                            <Typography sx={{ color: T.ink, fontSize: 13, fontWeight: 900, textTransform: "uppercase" }} noWrap>
                                                {user.station || "--"}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>

                                    <TableCell sx={{ py: 1.6, borderBottom: `1px solid ${T.line}` }}>
                                        <Tooltip arrow title={user.isAccountActive ? "Active" : "Inactive"}>
                                            <Chip
                                                size="small"
                                                label={user.isAccountActive ? "Active" : "Inactive"}
                                                sx={{
                                                    height: 24,
                                                    borderRadius: "6px",
                                                    bgcolor: user.isAccountActive ? "rgba(22,163,74,0.09)" : "rgba(220,38,38,0.09)",
                                                    color: user.isAccountActive ? T.green : T.red,
                                                    fontSize: 11,
                                                    fontWeight: 900,
                                                    "& .MuiChip-label": { px: 1 },
                                                    "&:before": {
                                                        content: '""',
                                                        display: "block",
                                                        width: 5,
                                                        height: 5,
                                                        borderRadius: "50%",
                                                        bgcolor: user.isAccountActive ? T.green : T.red,
                                                        ml: 0.8,
                                                    },
                                                }}
                                            />
                                        </Tooltip>
                                    </TableCell>

                                    <TableCell align="center" sx={{ py: 1.6, borderBottom: `1px solid ${T.line}` }}>
                                        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.7 }}>
                                            <Tooltip title="view actions">
                                                <IconButton
                                                    onClick={() => onViewUser(user)}
                                                    sx={{
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: "8px",
                                                        border: `1px solid ${T.line}`,
                                                        color: T.ink,
                                                        bgcolor: "#FFFFFF",
                                                        "&:hover": { bgcolor: "rgba(17,103,232,0.06)", color: T.blue },
                                                    }}
                                                >
                                                    <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>

                                        </Box>
                                    </TableCell>
                                </TableRow>

                                {user.canClockOutside && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            sx={{ py: 1.2, px: 2, bgcolor: "rgba(22,163,74,0.035)", borderBottom: `1px solid ${T.line}` }}
                                        >
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    flexWrap: "wrap",
                                                    gap: 1.5,
                                                    py: 1,
                                                    px: 1.5,
                                                    borderLeft: `3px solid ${T.green}`,
                                                    borderRadius: "8px",
                                                    bgcolor: "#FFFFFF",
                                                }}
                                            >
                                                <Typography variant="caption" fontWeight={900} color={T.green}>
                                                    Clock Outside Authorized
                                                </Typography>
                                                <Typography variant="caption" color={T.muted} fontWeight={700}>
                                                    <strong>Reason:</strong> {user.outsideClockingDetails?.reason}
                                                </Typography>
                                                <Typography variant="caption" color={T.muted} fontWeight={700}>
                                                    <strong>Authorized By:</strong> {user.outsideClockingDetails?.authorizedBy}
                                                </Typography>
                                                <Typography variant="caption" color={T.muted} fontWeight={700}>
                                                    <strong>Valid:</strong>{" "}
                                                    {new Date(user.outsideClockingDetails?.startDate).toLocaleDateString()}
                                                    {" - "}
                                                    {new Date(user.outsideClockingDetails?.endDate).toLocaleDateString()}
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

            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "stretch", sm: "center" },
                    justifyContent: "space-between",
                    gap: 1.5,
                    px: { xs: 2, md: 3 },
                    py: 1.6,
                    borderTop: `1px solid ${T.line}`,
                }}
            >
                <Typography sx={{ color: T.muted, fontSize: 12, fontWeight: 800 }}>
                    Showing {users.length === 0 ? 0 : safePage * rowsPerPage + 1} to {Math.min((safePage + 1) * rowsPerPage, users.length)} of {users.length} users
                </Typography>
                <TablePagination
                    component="div"
                    page={safePage}
                    count={users.length}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[10, 50, 100]}
                    onPageChange={onPageChange}
                    onRowsPerPageChange={onRowsPerPageChange}
                    sx={{
                        minHeight: 0,
                        overflow: "visible",
                        "& .MuiTablePagination-toolbar": {
                            minHeight: 0,
                            p: 0,
                            gap: 1,
                            flexWrap: "wrap",
                            justifyContent: { xs: "flex-start", sm: "flex-end" },
                        },
                        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                            color: T.muted,
                            fontSize: 12,
                            fontWeight: 800,
                            m: 0,
                        },
                        "& .MuiTablePagination-actions button": {
                            width: 36,
                            height: 36,
                            borderRadius: "8px",
                            border: `1px solid ${T.line}`,
                            mx: 0.25,
                        },
                    }}
                />
            </Box>
        </Paper>
    );
}
