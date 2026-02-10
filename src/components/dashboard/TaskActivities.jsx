import {
    Add,
    Assignment,
    CalendarToday,
    Delete,
    MoreVert,
    Search
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    InputAdornment,
    Menu,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { colorPalette } from '../Dashboard';

const TasksActivitiesContent = ({ tasks, setTasks, currentTime }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [newTask, setNewTask] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);

    const handleAddTask = () => {
        if (newTask.trim()) {
            const task = {
                id: tasks.length + 1,
                title: newTask,
                status: 'pending',
                time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                date: currentTime.toISOString().split('T')[0],
                priority: 'medium',
                category: 'Research'
            };
            setTasks([...tasks, task]);
            setNewTask('');
            setTaskDialogOpen(false);
        }
    };

    const handleDeleteTask = (id) => {
        setTasks(tasks.filter(task => task.id !== id));
        setAnchorEl(null);
    };

    const handleStatusChange = (id, newStatus) => {
        setTasks(tasks.map(task => task.id === id ? { ...task, status: newStatus } : task));
        setAnchorEl(null);
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || task.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const TaskStatusBadge = ({ status }) => {
        const statusConfig = {
            'completed': { color: colorPalette.seafoamGreen, label: 'Completed' },
            'in-progress': { color: colorPalette.warmSand, label: 'In Progress' },
            'pending': { color: colorPalette.cyanFresh, label: 'Pending' }
        };
        const config = statusConfig[status];
        return <Chip label={config.label} size="small" sx={{ bgcolor: `${config.color}20`, color: config.color, fontWeight: 600 }} />;
    };

    const stats = [
        { label: 'Total Tasks', value: tasks.length, color: colorPalette.oceanBlue },
        { label: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: colorPalette.seafoamGreen },
        { label: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: colorPalette.warmSand },
        { label: 'Pending', value: tasks.filter(t => t.status === 'pending').length, color: colorPalette.cyanFresh }
    ];

    return (
        <Grid container spacing={3}>
            {/* Stats Cards */}
            {stats.map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: `2px solid ${stat.color}30`, bgcolor: `${stat.color}10` }}>
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="h3" fontWeight="900" color={stat.color}>{stat.value}</Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>{stat.label}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))}

            {/* Search and Filter Bar */}
            <Grid item xs={12}>
                <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${colorPalette.softGray}` }}>
                    <CardContent>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                            <TextField
                                fullWidth
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ color: colorPalette.oceanBlue }} />
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            />
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Button
                                    variant={filterStatus === 'all' ? 'contained' : 'outlined'}
                                    onClick={() => setFilterStatus('all')}
                                    sx={{
                                        borderRadius: 3,
                                        textTransform: 'none',
                                        bgcolor: filterStatus === 'all' ? colorPalette.oceanBlue : 'transparent',
                                        borderColor: colorPalette.oceanBlue,
                                        color: filterStatus === 'all' ? 'white' : colorPalette.oceanBlue
                                    }}
                                >
                                    All
                                </Button>
                                {['pending', 'in-progress', 'completed'].map((status) => (
                                    <Button
                                        key={status}
                                        variant={filterStatus === status ? 'contained' : 'outlined'}
                                        onClick={() => setFilterStatus(status)}
                                        sx={{
                                            borderRadius: 3,
                                            textTransform: 'none',
                                            bgcolor: filterStatus === status ? colorPalette.oceanBlue : 'transparent',
                                            borderColor: colorPalette.oceanBlue,
                                            color: filterStatus === status ? 'white' : colorPalette.oceanBlue
                                        }}
                                    >
                                        {status.replace('-', ' ')}
                                    </Button>
                                ))}
                            </Box>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => setTaskDialogOpen(true)}
                                sx={{
                                    bgcolor: colorPalette.oceanBlue,
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    px: 3,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                New Task
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>

            {/* Tasks List */}
            <Grid item xs={12}>
                <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${colorPalette.softGray}` }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="800" color={colorPalette.deepNavy} sx={{ mb: 3 }}>
                            Task List ({filteredTasks.length})
                        </Typography>
                        <Stack spacing={2}>
                            {filteredTasks.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <Assignment sx={{ fontSize: 64, color: colorPalette.softGray, mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary">No tasks found</Typography>
                                    <Typography variant="body2" color="text.secondary">Try adjusting your search or filters</Typography>
                                </Box>
                            ) : (
                                filteredTasks.map((task) => (
                                    <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 3,
                                                bgcolor: colorPalette.softGray,
                                                borderRadius: 3,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateX(4px)',
                                                    boxShadow: `0 4px 12px ${colorPalette.oceanBlue}20`
                                                }
                                            }}
                                        >
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                <Box
                                                    sx={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 2,
                                                        bgcolor: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <Assignment sx={{ color: colorPalette.oceanBlue }} />
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body1" fontWeight="700" color={colorPalette.deepNavy}>
                                                        {task.title}
                                                    </Typography>
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                                        <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {task.date} • {task.time}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                                <TaskStatusBadge status={task.status} />
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        setAnchorEl(e.currentTarget);
                                                        setSelectedTask(task);
                                                    }}
                                                >
                                                    <MoreVert />
                                                </IconButton>
                                            </Stack>
                                        </Paper>
                                    </motion.div>
                                ))
                            )}
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>

            {/* Task Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { borderRadius: 3, minWidth: 180 } }}
            >
                <MenuItem onClick={() => selectedTask && handleStatusChange(selectedTask.id, 'pending')}>
                    <Chip label="Mark Pending" size="small" sx={{ bgcolor: `${colorPalette.cyanFresh}20`, color: colorPalette.cyanFresh, mr: 1 }} />
                </MenuItem>
                <MenuItem onClick={() => selectedTask && handleStatusChange(selectedTask.id, 'in-progress')}>
                    <Chip label="Mark In Progress" size="small" sx={{ bgcolor: `${colorPalette.warmSand}20`, color: colorPalette.warmSand, mr: 1 }} />
                </MenuItem>
                <MenuItem onClick={() => selectedTask && handleStatusChange(selectedTask.id, 'completed')}>
                    <Chip label="Mark Completed" size="small" sx={{ bgcolor: `${colorPalette.seafoamGreen}20`, color: colorPalette.seafoamGreen, mr: 1 }} />
                </MenuItem>
                <MenuItem onClick={() => selectedTask && handleDeleteTask(selectedTask.id)} sx={{ color: colorPalette.coralSunset }}>
                    <Delete sx={{ mr: 1, fontSize: 20 }} /> Delete Task
                </MenuItem>
            </Menu>

            {/* Add Task Dialog */}
            <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800, color: colorPalette.deepNavy }}>Create New Task</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Task Description"
                        fullWidth
                        multiline
                        rows={4}
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        variant="outlined"
                        placeholder="Enter detailed task description..."
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setTaskDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button onClick={handleAddTask} variant="contained" sx={{ bgcolor: colorPalette.oceanBlue, borderRadius: 3, textTransform: 'none', fontWeight: 700, px: 3 }}>
                        Create Task
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
};

export default TasksActivitiesContent;