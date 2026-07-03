import { useCallback, useEffect, useState } from "react";

import {
    Alert,
    Box,
    Grid,
    Skeleton
} from "@mui/material";


import { getDashboardFull } from "../../service/SuperadminService";
import AttendanceCard from "../util/cards/Attendance";
import ConfigurationCard from "../util/cards/Configuration";
import DashboardSummaryCards from "../util/cards/DashBoardSummaryCards";
import OrganizationCard from "../util/cards/OrganisationCard";
import SystemHealthCard from "../util/cards/SystemHealth";
import UsersCard from "../util/cards/UserCard";

const SuperAdminDashBoardTab = () => {

    const [dashboard, setDashboard] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const loadDashboard = useCallback(async () => {

        try {

            setLoading(true);

            setError("");

            const response = await getDashboardFull();

            setDashboard(response.dashboard);

        }

        catch (err) {

            console.error(err);

            setError(

                err?.response?.data?.message ||

                "Failed to load dashboard."

            );

        }

        finally {

            setLoading(false);

        }

    }, []);

    useEffect(() => {

        loadDashboard();

    }, [loadDashboard]);

    if (loading) {

        return (

            <Grid container spacing={3}>

                {Array.from({ length: 8 }).map((_, index) => (

                    <Grid
                        item
                        xs={12}
                        sm={6}
                        lg={3}
                        key={index}
                    >

                        <Skeleton
                            variant="rounded"
                            height={170}
                        />

                    </Grid>

                ))}

            </Grid>

        );

    }

    if (error) {

        return (

            <Alert severity="error">

                {error}

            </Alert>

        );

    }

    return (

        <Box>



            {/* ============================ */}
            {/* KPI CARDS */}
            {/* ============================ */}

            <DashboardSummaryCards

                dashboard={dashboard}

            />

            <Grid

                container

                spacing={3}

                mt={1}

            >

                <Grid

                    item

                    xs={12}

                    md={6}

                >

                    <OrganizationCard

                        organization={dashboard.organization}

                    />

                </Grid>

                <Grid

                    item

                    xs={12}

                    md={6}

                >

                    <UsersCard

                        users={dashboard.users}

                    />

                </Grid>

                <Grid

                    item

                    xs={12}

                    md={6}

                >

                    <AttendanceCard

                        attendance={dashboard.attendance}

                    />

                </Grid>

                <Grid

                    item

                    xs={12}

                    md={6}

                >

                    <ConfigurationCard

                        configuration={dashboard.configuration}

                    />

                </Grid>

                <Grid

                    item

                    xs={12}

                    md={6}

                >

                    <SystemHealthCard

                        health={dashboard.health}

                    />

                </Grid>

            </Grid>

        </Box>

    );

};

export default SuperAdminDashBoardTab;