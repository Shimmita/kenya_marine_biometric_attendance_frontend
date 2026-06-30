
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
    Typography
} from "@mui/material";

import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import React from "react";
import coreDataDetails from "../CoreDataDetails";
const { C } = coreDataDetails
const rankStyles = {

    superadmin: {
        bg: "rgba(103,58,183,.18)",
        color: "#B388FF",
        border: "rgba(179,136,255,.45)"
    },

    admin: {
        bg: "rgba(255,180,0,.16)",
        color: C.warmSand,
        border: "rgba(255,180,0,.40)"
    },

    ceo: {
        bg: "rgba(26,35,126,.18)",
        color: C.skyBlue,
        border: "rgba(135,206,235,.35)"
    },

    hr: {
        bg: "rgba(255,111,97,.16)",
        color: C.coralSunset,
        border: "rgba(255,111,97,.38)"
    },

    supervisor: {
        bg: "rgba(72,201,176,.15)",
        color: C.seafoamGreen,
        border: "rgba(72,201,176,.38)"
    },

    auditor: {
        bg: "rgba(156,39,176,.15)",
        color: "#CE93D8",
        border: "rgba(206,147,216,.38)"
    },

    user: {
        bg: "rgba(0,229,255,.08)",
        color: C.aquaVibrant,
        border: "rgba(0,229,255,.35)"
    }

};


const truncateText = (text, maxLength = 8) => {
    if (!text) return "--";

    return text.length > maxLength
        ? `${text.substring(0, maxLength)}...`
        : text;
};

export default function UserTable({
    users,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    onViewUser
}) {



    return (

        <Paper
            elevation={0}
            sx={{
                borderRadius: 3,
                overflow: "hidden",
                bgcolor: C.glassBg,
                backdropFilter: "blur(18px)",
                border: `1px solid ${C.glassBorder}`,
                boxShadow: "0 14px 32px rgba(0,0,0,.28)"
            }}
        >

            <TableContainer>

                <Table stickyHeader>
                    <TableHead>

                        <TableRow
                            sx={{
                                background: C.oceanGradient,

                                "& .MuiTableCell-root": {
                                    background: "transparent",
                                    color: C.cloudWhite,
                                    fontWeight: 800,
                                    fontSize: ".70rem",
                                    textTransform: "uppercase",
                                    letterSpacing: ".06em",
                                    borderBottom: `1px solid ${C.glassBorder}`
                                }
                            }}
                        >


                            <TableCell>Image</TableCell>

                            <TableCell>UserID</TableCell>

                            <TableCell>StaffNo</TableCell>

                            <TableCell>Name</TableCell>
                            <TableCell>Role</TableCell>

                            <TableCell>Department</TableCell>
                            <TableCell>Station</TableCell>

                            <TableCell>Status</TableCell>

                            <TableCell align="center">

                                View

                            </TableCell>

                        </TableRow>

                    </TableHead>

                    <TableBody>

                        {users
                            .slice(
                                page * rowsPerPage,
                                page * rowsPerPage + rowsPerPage
                            )
                            .map((user) => {

                                const style =
                                    rankStyles[user.rank] ||
                                    rankStyles.user;

                                return (

                                    <React.Fragment key={user._id}>

                                        {/* ===================== MAIN ROW ===================== */}

                                        <TableRow
                                            hover
                                            sx={{
                                                cursor: "pointer",
                                                transition: ".25s ease",
                                                "&:hover": {
                                                    bgcolor: "rgba(0,229,255,.035)"
                                                },
                                                "& td": {
                                                    borderBottom: user.canClockOutside
                                                        ? "none"
                                                        : "1px solid rgba(255,255,255,.08)"
                                                }
                                            }}
                                        >

                                            <TableCell>

                                                <Avatar
                                                    src={user.avatar}
                                                    sx={{

                                                        width: 42,

                                                        height: 42,

                                                        fontWeight: 800,

                                                        background:
                                                            C.freshGradient,

                                                        border: `1px solid ${C.glassBorder}`

                                                    }}
                                                >
                                                    {user.name?.charAt(0)}
                                                </Avatar>

                                            </TableCell>


                                            <Tooltip arrow title={user.employeeId}>
                                                <TableCell>
                                                    {user.employeeId || "--"}
                                                </TableCell>
                                            </Tooltip>

                                            <Tooltip title={user.staffNo} arrow>
                                                <TableCell>
                                                    {user.staffNo || "--"}
                                                </TableCell>
                                            </Tooltip>

                                            <TableCell>

                                                <Box>
                                                    <Tooltip arrow title={user.name}>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {user.name}
                                                        </Typography>
                                                    </Tooltip>
                                                    <Tooltip arrow title={user.email}>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            {user.email}
                                                        </Typography>
                                                    </Tooltip>

                                                </Box>

                                            </TableCell>

                                            <TableCell>

                                                <Tooltip arrow title={user.role}>
                                                    <Chip

                                                        label={user.role}

                                                        sx={{

                                                            bgcolor: style.bg,

                                                            color: style.color,

                                                            border: `1px solid ${style.border}`

                                                        }}

                                                    />
                                                </Tooltip>


                                            </TableCell>

                                            <TableCell>
                                                <Tooltip arrow title={user.department}>
                                                    <Chip
                                                        label={truncateText(user.department)}
                                                        size="small"
                                                    />
                                                </Tooltip>


                                            </TableCell>

                                            <TableCell>

                                                <Tooltip arrow title={user.station}>
                                                    <Chip
                                                        label={user.station}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                </Tooltip>

                                            </TableCell>



                                            <TableCell>

                                                <Tooltip arrow title={user.isAccountActive
                                                    ? "Active"
                                                    : "Inactive"}>
                                                    <Chip
                                                        size="small"
                                                        label={
                                                            user.isAccountActive
                                                                ? "Active"
                                                                : "Inactive"
                                                        }
                                                        sx={{
                                                            bgcolor: user.isAccountActive
                                                                ? "rgba(72,201,176,.15)"
                                                                : "rgba(255,92,74,.15)",

                                                            color: user.isAccountActive
                                                                ? "#48C9B0"
                                                                : "#FF5C4A",

                                                            border: `1px solid ${user.isAccountActive
                                                                ? "rgba(72,201,176,.35)"
                                                                : "rgba(255,92,74,.35)"
                                                                }`
                                                        }}
                                                    />
                                                </Tooltip>

                                            </TableCell>

                                            <TableCell align="center">

                                                <Tooltip title="View User">

                                                    <IconButton
                                                        onClick={() => onViewUser(user)}

                                                        sx={{

                                                            border: `1px solid ${C.glassBorder}`,

                                                            background: "rgba(0,229,255,.04)",

                                                            "&:hover": {

                                                                background: "rgba(0,229,255,.12)",

                                                                color: C.aquaVibrant,

                                                                transform: "scale(1.05)"

                                                            }

                                                        }}
                                                    >
                                                        <VisibilityRoundedIcon />
                                                    </IconButton>

                                                </Tooltip>

                                            </TableCell>

                                        </TableRow>

                                        {/* ================= CLOCK OUTSIDE INFO ================= */}

                                        {user.canClockOutside && (

                                            <TableRow>

                                                <TableCell
                                                    colSpan={9}
                                                    sx={{
                                                        py: 1.25,
                                                        px: 3,
                                                        borderBottom:
                                                            "1px solid rgba(72,201,176,.22)",
                                                        bgcolor:
                                                            "rgba(72,201,176,.045)"
                                                    }}
                                                >

                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            flexWrap: "wrap",
                                                            gap: 2,

                                                            py: .8,
                                                            px: 2,

                                                            borderLeft:
                                                                "4px solid #48C9B0",

                                                            borderRadius: 2,

                                                            background:
                                                                "linear-gradient(90deg, rgba(72,201,176,.08), rgba(0,229,255,.02))"
                                                        }}
                                                    >

                                                        <Chip
                                                            label="Clock Outside Authorized"
                                                            size="small"
                                                            color="success"
                                                            sx={{
                                                                fontWeight: 700
                                                            }}
                                                        />

                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: "text.secondary"
                                                            }}
                                                        >

                                                            <strong>Reason:</strong>{" "}

                                                            {user.outsideClockingDetails?.reason}

                                                        </Typography>

                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: "text.secondary"
                                                            }}
                                                        >

                                                            <strong>Authorized By:</strong>{" "}

                                                            {user.outsideClockingDetails?.authorizedBy}

                                                        </Typography>

                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: "text.secondary"
                                                            }}
                                                        >

                                                            <strong>Valid:</strong>{" "}

                                                            {new Date(
                                                                user.outsideClockingDetails.startDate
                                                            ).toLocaleDateString()}

                                                            {"  →  "}

                                                            {new Date(
                                                                user.outsideClockingDetails.endDate
                                                            ).toLocaleDateString()}

                                                        </Typography>

                                                    </Box>

                                                </TableCell>

                                            </TableRow>

                                        )}
                                    </React.Fragment>

                                );

                            })

                        }

                    </TableBody>

                </Table>

            </TableContainer>

            <TablePagination

                component="div"

                page={page}

                count={users.length}

                rowsPerPage={rowsPerPage}

                rowsPerPageOptions={[10, 50, 100]}

                onPageChange={onPageChange}

                onRowsPerPageChange={onRowsPerPageChange}
                sx={{

                    borderTop: `1px solid ${C.glassBorder}`,

                    color: C.textSecondary,

                    background: C.glassBgElevated,

                    "& .MuiTablePagination-selectLabel": {

                        color: C.textSecondary

                    },

                    "& .MuiTablePagination-displayedRows": {

                        color: C.textSecondary

                    },

                    "& .MuiIconButton-root": {

                        color: C.aquaVibrant

                    }

                }}

            />

        </Paper>

    );

}