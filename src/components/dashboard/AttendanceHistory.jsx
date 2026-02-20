import {
    AccessTime, CalendarMonth, CheckCircle, Download, EmojiEvents,
    FilterList, History, QueryStats, Refresh, TrendingDown, TrendingUp, WorkHistory,
} from '@mui/icons-material';
import {
    Alert, Box, Button, Chip, CircularProgress, Collapse, Divider, Grid,
    LinearProgress, MenuItem, Skeleton, Snackbar, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TablePagination, TableRow,
    TextField, Typography,
} from '@mui/material';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
    Legend, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import { fetchAttendanceStats, fetchClockingHistory } from '../../service/ClockingService';
import coreDataDetails from '../CoreDataDetails';
import { formatDate, formatTime } from '../util/DateTimeFormater';

const { colorPalette } = coreDataDetails;

/* ══ GLASS TOKENS ══════════════════════════════════════════════════════════ */
const G = {
    card:       { background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.60)', boxShadow: '0 4px 24px rgba(10,61,98,0.08), inset 0 1px 0 rgba(255,255,255,0.80)' },
    cardStrong: { background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(28px) saturate(200%)', WebkitBackdropFilter: 'blur(28px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 8px 32px rgba(10,61,98,0.12), inset 0 1px 0 rgba(255,255,255,0.90)' },
    tile:       { background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.22)' },
    heroBg:     'linear-gradient(140deg, #061e30 0%, #0a3560 42%, #073a52 68%, #052840 100%)',
    input:      { '& .MuiOutlinedInput-root': { borderRadius: '12px', background: 'rgba(10,61,98,0.03)', '&:hover fieldset': { borderColor: colorPalette.oceanBlue }, '&.Mui-focused fieldset': { borderColor: colorPalette.oceanBlue, borderWidth: 2 } } },
};

const safe = (v, s = '') => (v != null ? `${v}${s}` : '—');
const STATUS_PIE_COLORS = [colorPalette.seafoamGreen, '#f59e0b', colorPalette.coralSunset, '#6366f1'];
const TIMING_COLORS = { Early: colorPalette.seafoamGreen, Late: colorPalette.coralSunset };

const statusCfg = {
    Present: { bg: `${colorPalette.seafoamGreen}22`, color: colorPalette.seafoamGreen },
    Halfday: { bg: '#f59e0b22', color: '#d97706' },
    Late:    { bg: '#ef444422', color: '#dc2626' },
    Absent:  { bg: `${colorPalette.coralSunset}22`, color: colorPalette.coralSunset },
    '':      { bg: '#e0e0e022', color: '#9e9e9e' },
};
const StatusPill = ({ label }) => {
    const c = statusCfg[label] || statusCfg[''];
    return <Chip label={label || '—'} size="small" sx={{ height: 22, fontWeight: 800, fontSize: '0.7rem', bgcolor: c.bg, color: c.color, borderRadius: '8px' }} />;
};

/* ══ AMBIENT ORBS ══════════════════════════════════════════════════════════ */
const AmbientOrbs = () => (
    <>
        {[{ s:420,t:-60,l:-100,c:'rgba(10,100,180,0.07)',b:70},{s:350,t:'40%',r:-80,c:'rgba(32,178,170,0.06)',b:60},{s:500,bot:-120,l:'30%',c:'rgba(10,61,98,0.05)',b:80}]
            .map(({s,t,l,r,bot,c,b},i)=>(
                <Box key={i} sx={{position:'absolute',width:s,height:s,pointerEvents:'none',zIndex:0,top:t,left:l,right:r,bottom:bot,borderRadius:'50%',background:c,filter:`blur(${b}px)`}}/>
            ))}
    </>
);

/* ══ SCROLL-TRIGGERED REVEAL ═══════════════════════════════════════════════ */
const Reveal = ({ children, delay = 0, y = 22 }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
            {children}
        </motion.div>
    );
};

/* ══ GLASS TOOLTIP FOR RECHARTS ════════════════════════════════════════════ */
const GlassTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ background:'rgba(255,255,255,0.94)', backdropFilter:'blur(24px)', border:'1px solid rgba(10,61,98,0.12)', borderRadius:'14px', px:2, py:1.5, boxShadow:'0 10px 36px rgba(10,61,98,0.16)', minWidth:130 }}>
            {label && <Typography variant="caption" fontWeight={800} color={colorPalette.deepNavy} sx={{display:'block',mb:0.6}}>{label}</Typography>}
            {payload.map((p,i)=>(
                <Stack key={i} direction="row" alignItems="center" spacing={1} sx={{mt:0.3}}>
                    <Box sx={{width:8,height:8,borderRadius:'50%',bgcolor:p.color||p.fill,flexShrink:0}}/>
                    <Typography variant="caption" color="text.secondary" sx={{fontWeight:600}}>{p.name||p.dataKey}:</Typography>
                    <Typography variant="caption" fontWeight={900} color={colorPalette.deepNavy}>{p.value}{p.unit||''}</Typography>
                </Stack>
            ))}
        </Box>
    );
};

/* ══ ANIMATED STAT CARD ════════════════════════════════════════════════════ */
const StatCard = ({ label, value, subtitle, icon, accent, trend, trendLabel, progress }) => (
    <Box sx={{ ...G.card, p:2.5, height:'100%', borderRadius:'20px', position:'relative', overflow:'hidden',
        transition:'all 0.26s ease',
        '&:hover':{ transform:'translateY(-5px)', boxShadow:`0 16px 42px rgba(10,61,98,0.16)` },
        '&::after':{ content:'""', position:'absolute', top:0, left:0, right:0, height:3, borderRadius:'20px 20px 0 0', background:`linear-gradient(90deg,${accent},${accent}66)` },
        '&::before':{ content:'""', position:'absolute', top:-24, right:-24, width:84, height:84, borderRadius:'50%', background:`${accent}10`, zIndex:0 },
    }}>
        <Stack spacing={1.5} sx={{position:'relative',zIndex:1}}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{width:44,height:44,borderRadius:'14px',bgcolor:`${accent}14`,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${accent}22`}}>
                    {icon}
                </Box>
                {trend!=null&&<Chip size="small"
                    icon={trend>=0?<TrendingUp sx={{fontSize:'0.78rem !important',color:'#22c55e !important'}}/>:<TrendingDown sx={{fontSize:'0.78rem !important',color:'#ef4444 !important'}}/>}
                    label={trendLabel||`${Math.abs(trend)}%`}
                    sx={{height:22,fontSize:'0.7rem',fontWeight:800,bgcolor:trend>=0?'#22c55e18':'#ef444418',color:trend>=0?'#16a34a':'#dc2626',borderRadius:'8px','& .MuiChip-label':{px:0.8}}}
                />}
            </Stack>
            <Box>
                <Typography variant="h4" fontWeight={900} sx={{color:accent,lineHeight:1,fontVariantNumeric:'tabular-nums'}}>{value??<Skeleton width={60}/>}</Typography>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{textTransform:'uppercase',letterSpacing:0.8,display:'block',mt:0.3}}>{label}</Typography>
                {subtitle&&<Typography variant="caption" color="text.disabled" display="block" sx={{mt:0.2}}>{subtitle}</Typography>}
            </Box>
            {progress!=null&&<Box>
                <LinearProgress variant="determinate" value={Math.min(Number(progress),100)}
                    sx={{height:6,borderRadius:99,bgcolor:`${accent}14`,'& .MuiLinearProgress-bar':{bgcolor:accent,borderRadius:99}}}/>
                <Typography variant="caption" color="text.disabled" sx={{mt:0.4,display:'block'}}>{progress}%</Typography>
            </Box>}
        </Stack>
    </Box>
);

/* ══ HERO BANNER ═══════════════════════════════════════════════════════════ */
const HeroBanner = ({ stats, loading }) => (
    <Box sx={{borderRadius:'24px',background:G.heroBg,position:'relative',overflow:'hidden',mb:3,p:{xs:3,md:4}}}>
        <Box sx={{position:'absolute',top:-60,right:-60,width:220,height:220,borderRadius:'50%',background:'rgba(0,180,200,0.10)',filter:'blur(40px)',pointerEvents:'none'}}/>
        <Box sx={{position:'absolute',bottom:-80,left:-80,width:280,height:280,borderRadius:'50%',background:'rgba(10,61,98,0.30)',filter:'blur(50px)',pointerEvents:'none'}}/>
        <Box sx={{position:'absolute',top:'30%',left:'42%',width:180,height:180,borderRadius:'50%',background:'rgba(0,220,255,0.07)',filter:'blur(35px)',pointerEvents:'none'}}/>
        <Grid container spacing={3} alignItems="center" sx={{position:'relative',zIndex:1}}>
            <Grid item xs={12} md={5}>
                <Typography variant="caption" sx={{opacity:0.55,fontWeight:900,letterSpacing:2.2,textTransform:'uppercase',color:'#fff',display:'block'}}>
                    {new Date().toLocaleString('default',{month:'long',year:'numeric'})}
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={1.5} mt={0.5}>
                    <motion.div initial={{scale:0.4,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:0.7,ease:[0.22,1,0.36,1]}}>
                        <Typography variant="h2" fontWeight={900} sx={{fontSize:{xs:'3rem',md:'4.2rem'},lineHeight:1,fontVariantNumeric:'tabular-nums',color:'#fff',textShadow:'0 4px 24px rgba(0,0,0,0.28)'}}>
                            {loading?'—':safe(stats?.monthly?.attendanceRate,'%')}
                        </Typography>
                    </motion.div>
                    <Typography variant="h6" sx={{opacity:0.65,color:'#fff'}}>Attendance</Typography>
                </Stack>
                <motion.div initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{delay:0.3,duration:0.5}}>
                    <Stack direction="row" alignItems="center" spacing={0.8} mt={1}>
                        <TrendingUp sx={{fontSize:'1rem',opacity:0.65,color:'#00e5ff'}}/>
                        <Typography variant="body2" sx={{color:'rgba(255,255,255,0.75)'}}>
                            {loading?'Loading stats…':stats?.summary||''}
                        </Typography>
                    </Stack>
                </motion.div>
            </Grid>
            <Grid item xs={12} md={7}>
                <Grid container spacing={1.8}>
                    {[{label:'Days Present',val:stats?.monthly?.presentDays},{label:'Total Hours',val:stats?.monthly?.totalHours},{label:'Overtime',val:stats?.monthly?.overtimeHours},{label:'Avg Hrs/Day',val:stats?.monthly?.avgHoursPerDay}]
                        .map(({label,val},i)=>(
                            <Grid item xs={6} sm={3} key={label}>
                                <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.12+i*0.08,duration:0.45,ease:[0.22,1,0.36,1]}}>
                                    <Box sx={{...G.tile,p:1.6,borderRadius:'16px',transition:'all 0.22s ease','&:hover':{background:'rgba(255,255,255,0.22)',transform:'translateY(-4px)'}}}>
                                        <Typography variant="h5" fontWeight={900} sx={{fontVariantNumeric:'tabular-nums',color:'#fff',lineHeight:1.2}}>{loading?'…':val??'—'}</Typography>
                                        <Typography variant="caption" sx={{opacity:0.62,color:'#fff',display:'block',mt:0.3}}>{label}</Typography>
                                    </Box>
                                </motion.div>
                            </Grid>
                        ))}
                </Grid>
            </Grid>
        </Grid>
    </Box>
);

const SectionLabel = ({ children, accent, chip }) => (
    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Box sx={{width:4,height:18,borderRadius:2,bgcolor:accent}}/>
        <Typography variant="subtitle1" fontWeight={800} color={colorPalette.deepNavy}>{children}</Typography>
        {chip&&<Chip label={chip} size="small" sx={{bgcolor:`${accent}14`,color:accent,fontWeight:700,fontSize:'0.7rem',borderRadius:'8px'}}/>}
    </Stack>
);

/* ══ CHART SECTION ═════════════════════════════════════════════════════════ */
const ChartSection = ({ history }) => {
    /* ── Status donut data ── */
    const statusData = useMemo(()=>{
        const counts = {Present:0,Halfday:0,Late:0,Absent:0};
        history.forEach(r=>{
            if(r.status==='Present')counts.Present++;
            else if(r.status==='Halfday')counts.Halfday++;
        });
        counts.Late = history.filter(r=>r.timing==='Late').length;
        counts.Absent = Math.max(0,history.length-counts.Present-counts.Halfday);
        return Object.entries(counts).filter(([,v])=>v>0).map(([name,value])=>({name,value}));
    },[history]);

    /* ── Hours bar: last 14 days ── */
    const hoursData = useMemo(()=>
        [...history].slice(0,14).reverse().map(r=>({
            date:r.date?.slice(0,5)||'',
            hours:r.hours!=='—'?parseFloat(r.hours):0,
            target:9,
        }))
    ,[history]);

    /* ── Weekly timing: Early vs Late count ── */
    const timingData = useMemo(()=>{
        const map={};
        history.forEach(r=>{
            if(!r.rawDate)return;
            const d=r.rawDate;
            const wk=`${d.toLocaleString('default',{month:'short'})} W${Math.ceil(d.getDate()/7)}`;
            if(!map[wk])map[wk]={week:wk,Early:0,Late:0};
            map[wk][r.timing==='Late'?'Late':'Early']++;
        });
        return Object.values(map).slice(-8).reverse();
    },[history]);

    /* ── Monthly hours bar (group by month) ── */
    const monthlyHoursData = useMemo(()=>{
        const map={};
        history.forEach(r=>{
            if(!r.rawDate||r.hours==='—')return;
            const key=r.rawDate.toLocaleString('default',{month:'short',year:'2-digit'});
            if(!map[key])map[key]={month:key,hours:0,days:0};
            map[key].hours+=parseFloat(r.hours)||0;
            map[key].days++;
        });
        return Object.values(map).slice(-6).reverse().map(m=>({...m,hours:parseFloat(m.hours.toFixed(1))}));
    },[history]);

    /* ── Custom Donut center label ── */
    const DonutCenter = ({ cx, cy }) => (
        <>
            <text x={cx} y={cy-6} textAnchor="middle" dominantBaseline="central" fill={colorPalette.deepNavy} fontSize={22} fontWeight={900}>{history.length}</text>
            <text x={cx} y={cy+14} textAnchor="middle" dominantBaseline="central" fill="#94a3b8" fontSize={10} fontWeight={700}>Records</text>
        </>
    );

    const renderCustomLabel = ({cx,cy,midAngle,innerRadius,outerRadius,percent})=>{
        if(percent<0.07)return null;
        const R=Math.PI/180;
        const r=innerRadius+(outerRadius-innerRadius)*0.56;
        return <text x={cx+r*Math.cos(-midAngle*R)} y={cy+r*Math.sin(-midAngle*R)} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={900}>{`${(percent*100).toFixed(0)}%`}</text>;
    };

    return (
        <Box mb={4} sx={{position:'relative',zIndex:1}}>
            <Reveal>
                <SectionLabel accent={colorPalette.cyanFresh} chip="Interactive charts">Visual Insights</SectionLabel>
            </Reveal>
            <Grid container spacing={2.5}>

                {/* ── Donut: Attendance Status ── */}
                <Grid item xs={12} md={4}>
                    <Reveal delay={0}>
                        <Box sx={{...G.card,borderRadius:'22px',p:2.8,height:'100%'}}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                <Box sx={{width:4,height:16,borderRadius:2,bgcolor:colorPalette.seafoamGreen}}/>
                                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Status Breakdown</Typography>
                            </Stack>
                            <Typography variant="caption" color="text.disabled" mb={1.5} display="block">Last 90 days distribution</Typography>
                            <Box sx={{position:'relative'}}>
                                <ResponsiveContainer width="100%" height={210}>
                                    <PieChart>
                                        <defs>
                                            {STATUS_PIE_COLORS.map((c,i)=>(
                                                <radialGradient key={i} id={`pieGrad${i}`} cx="50%" cy="50%" r="50%">
                                                    <stop offset="0%" stopColor={c} stopOpacity={1}/>
                                                    <stop offset="100%" stopColor={c} stopOpacity={0.7}/>
                                                </radialGradient>
                                            ))}
                                        </defs>
                                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                                            paddingAngle={4} dataKey="value"
                                            animationBegin={200} animationDuration={1000}
                                            labelLine={false} label={renderCustomLabel}
                                            stroke="rgba(255,255,255,0.6)" strokeWidth={3}>
                                            {statusData.map((_,i)=><Cell key={i} fill={`url(#pieGrad${i%STATUS_PIE_COLORS.length})`}/>)}
                                        </Pie>
                                        <RTooltip content={<GlassTooltip/>}/>
                                        <DonutCenter cx={0} cy={0}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                            <Stack spacing={0.9} mt={0.5}>
                                {statusData.map((item,i)=>(
                                    <Stack key={item.name} direction="row" alignItems="center" justifyContent="space-between">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Box sx={{width:11,height:11,borderRadius:'4px',bgcolor:STATUS_PIE_COLORS[i%STATUS_PIE_COLORS.length]}}/>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>{item.name}</Typography>
                                        </Stack>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography variant="caption" fontWeight={900} color={colorPalette.deepNavy}>{item.value}</Typography>
                                            <Typography variant="caption" color="text.disabled">({((item.value/history.length)*100).toFixed(0)}%)</Typography>
                                        </Stack>
                                    </Stack>
                                ))}
                            </Stack>
                        </Box>
                    </Reveal>
                </Grid>

                {/* ── Bar: Daily Hours (last 14 days) ── */}
                <Grid item xs={12} md={8}>
                    <Reveal delay={0.07}>
                        <Box sx={{...G.card,borderRadius:'22px',p:2.8}}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Box sx={{width:4,height:16,borderRadius:2,bgcolor:colorPalette.oceanBlue}}/>
                                    <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Daily Hours Logged</Typography>
                                    <Chip label="Last 14 days" size="small" sx={{height:20,fontSize:'0.65rem',fontWeight:700,bgcolor:`${colorPalette.oceanBlue}10`,color:colorPalette.oceanBlue,borderRadius:'6px'}}/>
                                </Stack>
                                <Stack direction="row" spacing={2}>
                                    {[{c:'url(#hoursGrad)',l:'Actual'},{c:'rgba(10,61,98,0.12)',l:'9h target'}].map(({c,l})=>(
                                        <Stack key={l} direction="row" alignItems="center" spacing={0.5}>
                                            <Box sx={{width:10,height:10,borderRadius:'3px',bgcolor:c.includes('url')?colorPalette.aquaVibrant:c}}/>
                                            <Typography variant="caption" color="text.secondary" sx={{fontSize:'0.65rem'}}>{l}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Stack>
                            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>Hours worked per day vs 9-hour target</Typography>
                            <ResponsiveContainer width="100%" height={195}>
                                <BarChart data={hoursData} margin={{top:4,right:4,left:-22,bottom:0}} barCategoryGap="28%" barGap={2}>
                                    <defs>
                                        <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={colorPalette.aquaVibrant} stopOpacity={0.95}/>
                                            <stop offset="100%" stopColor={colorPalette.oceanBlue} stopOpacity={0.65}/>
                                        </linearGradient>
                                        <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="rgba(10,61,98,0.15)" stopOpacity={1}/>
                                            <stop offset="100%" stopColor="rgba(10,61,98,0.04)" stopOpacity={1}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false}/>
                                    <XAxis dataKey="date" tick={{fontSize:10,fill:'#94a3b8',fontWeight:600}} axisLine={false} tickLine={false}/>
                                    <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} domain={[0,13]}/>
                                    <RTooltip content={<GlassTooltip/>} cursor={{fill:'rgba(10,61,98,0.04)',radius:[4,4,0,0]}}/>
                                    <Bar dataKey="target" fill="url(#targetGrad)" radius={[5,5,0,0]} name="Target (9h)" animationDuration={600}/>
                                    <Bar dataKey="hours" fill="url(#hoursGrad)" radius={[7,7,0,0]} name="Hours" animationDuration={900} animationBegin={200}/>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Reveal>
                </Grid>

                {/* ── Stacked Area: Punctuality trend ── */}
                <Grid item xs={12} md={7}>
                    <Reveal delay={0.12}>
                        <Box sx={{...G.card,borderRadius:'22px',p:2.8}}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                <Box sx={{width:4,height:16,borderRadius:2,bgcolor:colorPalette.seafoamGreen}}/>
                                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Punctuality Trend</Typography>
                                <Chip label="Early vs Late" size="small" sx={{height:20,fontSize:'0.65rem',fontWeight:700,bgcolor:`${colorPalette.seafoamGreen}12`,color:colorPalette.seafoamGreen,borderRadius:'6px'}}/>
                            </Stack>
                            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>Weekly breakdown of on-time vs late arrivals</Typography>
                            <ResponsiveContainer width="100%" height={185}>
                                <AreaChart data={timingData} margin={{top:4,right:4,left:-22,bottom:0}}>
                                    <defs>
                                        <linearGradient id="earlyFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={colorPalette.seafoamGreen} stopOpacity={0.45}/>
                                            <stop offset="95%" stopColor={colorPalette.seafoamGreen} stopOpacity={0.02}/>
                                        </linearGradient>
                                        <linearGradient id="lateFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={colorPalette.coralSunset} stopOpacity={0.40}/>
                                            <stop offset="95%" stopColor={colorPalette.coralSunset} stopOpacity={0.02}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false}/>
                                    <XAxis dataKey="week" tick={{fontSize:10,fill:'#94a3b8',fontWeight:600}} axisLine={false} tickLine={false}/>
                                    <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                                    <RTooltip content={<GlassTooltip/>}/>
                                    <Area type="monotone" dataKey="Early" stroke={colorPalette.seafoamGreen} strokeWidth={2.5} fill="url(#earlyFill)" name="Early" dot={{r:4,fill:colorPalette.seafoamGreen,strokeWidth:0}} activeDot={{r:6,strokeWidth:2,stroke:'white'}} animationDuration={900} animationBegin={300}/>
                                    <Area type="monotone" dataKey="Late" stroke={colorPalette.coralSunset} strokeWidth={2.5} fill="url(#lateFill)" name="Late" dot={{r:4,fill:colorPalette.coralSunset,strokeWidth:0}} activeDot={{r:6,strokeWidth:2,stroke:'white'}} animationDuration={900} animationBegin={450}/>
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Reveal>
                </Grid>

                {/* ── Bar: Monthly total hours ── */}
                <Grid item xs={12} md={5}>
                    <Reveal delay={0.17}>
                        <Box sx={{...G.card,borderRadius:'22px',p:2.8,height:'100%'}}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                <Box sx={{width:4,height:16,borderRadius:2,bgcolor:'#f59e0b'}}/>
                                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Monthly Hours</Typography>
                                <Chip label="6 months" size="small" sx={{height:20,fontSize:'0.65rem',fontWeight:700,bgcolor:'#f59e0b14',color:'#d97706',borderRadius:'6px'}}/>
                            </Stack>
                            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>Total hours logged per month</Typography>
                            <ResponsiveContainer width="100%" height={185}>
                                <BarChart data={monthlyHoursData} layout="vertical" margin={{top:4,right:20,left:0,bottom:0}}>
                                    <defs>
                                        <linearGradient id="monthlyGrad" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                            <stop offset="100%" stopColor={colorPalette.coralSunset} stopOpacity={0.7}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" horizontal={false}/>
                                    <XAxis type="number" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                                    <YAxis type="category" dataKey="month" tick={{fontSize:10,fill:'#64748b',fontWeight:700}} axisLine={false} tickLine={false} width={52}/>
                                    <RTooltip content={<GlassTooltip/>} cursor={{fill:'rgba(10,61,98,0.04)'}}/>
                                    <Bar dataKey="hours" fill="url(#monthlyGrad)" radius={[0,8,8,0]} name="Total Hours" animationDuration={900} animationBegin={200}
                                        label={{position:'right',fontSize:9,fill:'#94a3b8',fontWeight:700,formatter:v=>`${v}h`}}/>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Reveal>
                </Grid>

            </Grid>
        </Box>
    );
};

/* ══ MAIN ══════════════════════════════════════════════════════════════════ */
export default function AttendanceHistoryContent() {
    const { user } = useSelector(s=>s.currentUser);
    const [stats,          setStats]          = useState(null);
    const [rawHistory,     setRawHistory]     = useState([]);
    const [loading,        setLoading]        = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [exporting,      setExporting]      = useState(false);
    const [snack,          setSnack]          = useState({ open:false, message:'', severity:'success' });
    const [filterStatus,   setFilterStatus]   = useState('All');
    const [filterTiming,   setFilterTiming]   = useState('All');
    const [filterMonth,    setFilterMonth]    = useState('');
    const [showFilters,    setShowFilters]    = useState(false);
    const [page,           setPage]           = useState(0);
    const [rowsPerPage,    setRowsPerPage]    = useState(10);

    const notify = (msg, sev='success') => setSnack({open:true,message:msg,severity:sev});
    console.log('in the attendance history')

    const loadData = async () => {
        setLoading(true); setHistoryLoading(true);
        try {
            const [statsData, historyData] = await Promise.all([fetchAttendanceStats(), fetchClockingHistory(90)]);
            setStats(statsData);
            setRawHistory(historyData.map(rec=>({
                date:formatDate(rec.clock_in),
                rawDate:new Date(rec.clock_in),
                clockIn:formatTime(rec.clock_in),
                clockOut:rec.clock_out?formatTime(rec.clock_out):'—',
                station:rec.station||'—',
                status:rec.clock_out?(rec.isPresent?'Present':'Halfday'):'',
                timing:rec.isLate?'Late':'Early',
                hours:rec.clock_out?((new Date(rec.clock_out)-new Date(rec.clock_in))/3_600_000).toFixed(2):'—',
            })));
        } catch { notify('Failed to load data.','error'); }
        finally { setLoading(false); setHistoryLoading(false); }
    };

    useEffect(()=>{loadData();},[]);// eslint-disable-line

    const filteredRows = useMemo(()=>rawHistory.filter(row=>{
        if(filterStatus!=='All'&&row.status!==filterStatus)return false;
        if(filterTiming!=='All'&&row.timing!==filterTiming)return false;
        if(filterMonth){const rm=`${row.rawDate.getFullYear()}-${String(row.rawDate.getMonth()+1).padStart(2,'0')}`;if(rm!==filterMonth)return false;}
        return true;
    }),[rawHistory,filterStatus,filterTiming,filterMonth]);

    const paginatedRows = filteredRows.slice(page*rowsPerPage, page*rowsPerPage+rowsPerPage);

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            const {default:jsPDF}=await import('jspdf'); const {default:autoTable}=await import('jspdf-autotable');
            const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}); const pw=doc.internal.pageSize.getWidth();
            doc.setFillColor(10,61,98); doc.rect(0,0,pw,28,'F'); doc.setTextColor(255,255,255);
            doc.setFontSize(16);doc.setFont('helvetica','bold');doc.text('Kenya Marine and Fisheries Research Institute',pw/2,10,{align:'center'});
            doc.setFontSize(11);doc.setFont('helvetica','normal');doc.text('Attendance Report — '+new Date().toLocaleString('default',{month:'long',year:'numeric'}),pw/2,18,{align:'center'});
            doc.setFontSize(9);doc.text(`Generated: ${new Date().toLocaleString()}  |  Employee: ${user?.name||'N/A'}  |  Dept: ${user?.department||'N/A'}`,pw/2,25,{align:'center'});
            const m=stats?.monthly; const sy=34;
            const boxes=[['Attendance Rate',safe(m?.attendanceRate,'%')],['Days Present',safe(m?.presentDays)],['Absent Days',safe(m?.absentDays)],['Total Hours',safe(m?.totalHours,' hrs')],['Overtime',safe(m?.overtimeHours,' hrs')],['Punctuality',safe(m?.punctualityRate,'%')]];
            const bw=(pw-20)/boxes.length;
            boxes.forEach(([lbl,val],i)=>{const x=10+i*bw;doc.setFillColor(245,248,252);doc.roundedRect(x,sy,bw-2,16,2,2,'F');doc.setTextColor(10,61,98);doc.setFontSize(12);doc.setFont('helvetica','bold');doc.text(val,x+bw/2-1,sy+7,{align:'center'});doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(100,116,139);doc.text(lbl,x+bw/2-1,sy+13,{align:'center'});});
            autoTable(doc,{head:[['Date','Clock In','Clock Out','Hours','Station','Timing','Status']],body:filteredRows.map(r=>[r.date,r.clockIn,r.clockOut,r.hours!=='—'?`${r.hours} hrs`:'—',r.station,r.timing,r.status||'—']),startY:sy+22,styles:{fontSize:8.5,cellPadding:2.5},headStyles:{fillColor:[10,61,98],textColor:255,fontStyle:'bold'},alternateRowStyles:{fillColor:[248,250,252]}});
            const tp=doc.internal.getNumberOfPages();
            for(let i=1;i<=tp;i++){doc.setPage(i);doc.setFontSize(7);doc.setTextColor(160,174,192);doc.text(`Page ${i} of ${tp}  |  KMFRI Digital Attendance Platform`,pw/2,doc.internal.pageSize.getHeight()-5,{align:'center'});}
            doc.save(`KMFRI_Attendance_${user?.name?.replace(/\s+/g,'_')||'Report'}_${new Date().toISOString().split('T')[0]}.pdf`);
            notify('Report exported!');
        } catch { notify('Export failed.','error'); }
        finally { setExporting(false); }
    };

    const w=stats?.weekly; const m=stats?.monthly;
    const weeklyCards=[
        {label:'This Week Hours',value:safe(w?.totalHours,' hrs'),subtitle:'Target: 40 hrs',icon:<AccessTime sx={{color:colorPalette.oceanBlue,fontSize:'1.3rem'}}/>,accent:colorPalette.oceanBlue,progress:w?.totalHours?((w.totalHours/40)*100).toFixed(0):null},
        {label:'Weekly Present',value:safe(w?.presentDays,' days'),subtitle:'Working days',icon:<CheckCircle sx={{color:colorPalette.seafoamGreen,fontSize:'1.3rem'}}/>,accent:colorPalette.seafoamGreen},
        {label:'Weekly Overtime',value:safe(w?.overtimeHours,' hrs'),subtitle:'Extra hours',icon:<WorkHistory sx={{color:'#f59e0b',fontSize:'1.3rem'}}/>,accent:'#f59e0b'},
        {label:'Late Arrivals',value:safe(w?.lateDays),subtitle:'This week',icon:<CalendarMonth sx={{color:colorPalette.coralSunset,fontSize:'1.3rem'}}/>,accent:colorPalette.coralSunset},
    ];
    const monthlyCards=[
        {label:'Days Present',value:safe(m?.presentDays),subtitle:'Full days (≥7 hrs)',icon:<CheckCircle sx={{color:colorPalette.seafoamGreen,fontSize:'1.3rem'}}/>,accent:colorPalette.seafoamGreen,progress:m?.attendanceRate},
        {label:'Half Days',value:safe(m?.halfDays),subtitle:'Partial attendance',icon:<AccessTime sx={{color:'#f59e0b',fontSize:'1.3rem'}}/>,accent:'#f59e0b'},
        {label:'Absent Days',value:safe(m?.absentDays),subtitle:'Working days missed',icon:<CalendarMonth sx={{color:colorPalette.coralSunset,fontSize:'1.3rem'}}/>,accent:colorPalette.coralSunset},
        {label:'Punctuality Rate',value:safe(m?.punctualityRate,'%'),subtitle:'On-time arrivals',icon:<EmojiEvents sx={{color:colorPalette.aquaVibrant,fontSize:'1.3rem'}}/>,accent:colorPalette.aquaVibrant,progress:m?.punctualityRate},
    ];

    return (
        <Box sx={{width:'100%',maxWidth:1200,mx:'auto',position:'relative'}}>
            <AmbientOrbs/>
            <Snackbar open={snack.open} autoHideDuration={5000} onClose={()=>setSnack(s=>({...s,open:false}))} anchorOrigin={{vertical:'top',horizontal:'center'}}>
                <Alert severity={snack.severity} variant="filled" elevation={6} onClose={()=>setSnack(s=>({...s,open:false}))} sx={{borderRadius:'14px',fontWeight:700,backdropFilter:'blur(16px)'}}>{snack.message}</Alert>
            </Snackbar>

            <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
                <HeroBanner stats={stats} loading={loading}/>
            </motion.div>

            {/* Toolbar */}
            <Reveal>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2} sx={{position:'relative',zIndex:1}}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <QueryStats sx={{color:colorPalette.deepNavy}}/>
                        <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy}>Detailed Statistics</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.5}>
                        <Button variant="outlined" startIcon={<Refresh sx={{fontSize:'1rem'}}/>} onClick={loadData} disabled={loading}
                            sx={{borderRadius:'12px',textTransform:'none',fontWeight:700,fontSize:'0.82rem',background:'rgba(255,255,255,0.72)',backdropFilter:'blur(12px)',borderColor:'rgba(10,61,98,0.15)',color:colorPalette.deepNavy,'&:hover':{borderColor:colorPalette.oceanBlue}}}>
                            Refresh
                        </Button>
                        <Button variant="contained" startIcon={exporting?<CircularProgress size={14} sx={{color:'white'}}/>:<Download/>} onClick={handleExportPDF} disabled={exporting||historyLoading}
                            sx={{borderRadius:'12px',textTransform:'none',fontWeight:700,fontSize:'0.82rem',background:colorPalette.oceanGradient,boxShadow:`0 6px 20px ${colorPalette.oceanBlue}40`,'&:hover':{boxShadow:`0 8px 28px ${colorPalette.oceanBlue}55`,transform:'translateY(-1px)'},transition:'all 0.22s'}}>
                            {exporting?'Generating…':'Download Report'}
                        </Button>
                    </Stack>
                </Stack>
            </Reveal>

            {/* Weekly cards */}
            <Box mb={3} sx={{position:'relative',zIndex:1}}>
                <Reveal><SectionLabel accent={colorPalette.aquaVibrant} chip={`Week of ${new Date(new Date().setDate(new Date().getDate()-new Date().getDay()+1)).toLocaleDateString('en-US',{month:'short',day:'numeric'})}`}>This Week</SectionLabel></Reveal>
                <Grid container spacing={2}>
                    {weeklyCards.map((c,i)=>(
                        <Grid item xs={6} sm={3} key={c.label}>
                            <Reveal delay={i*0.07}>{loading?<Skeleton variant="rounded" height={145} sx={{borderRadius:'20px'}}/>:<StatCard {...c}/>}</Reveal>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Monthly cards */}
            <Box mb={4} sx={{position:'relative',zIndex:1}}>
                <Reveal><SectionLabel accent={colorPalette.seafoamGreen}>{new Date().toLocaleString('default',{month:'long',year:'numeric'})}</SectionLabel></Reveal>
                <Grid container spacing={2}>
                    {monthlyCards.map((c,i)=>(
                        <Grid item xs={6} sm={3} key={c.label}>
                            <Reveal delay={i*0.07}>{loading?<Skeleton variant="rounded" height={160} sx={{borderRadius:'20px'}}/>:<StatCard {...c}/>}</Reveal>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* CHARTS */}
            {!historyLoading && rawHistory.length>0 && <ChartSection history={rawHistory}/>}

            {/* Monthly performance panel */}
            {!loading&&m&&(
                <Reveal>
                    <Box sx={{...G.cardStrong,borderRadius:'22px',p:{xs:2.5,md:3},mb:4,position:'relative',zIndex:1}}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
                            <Box sx={{width:44,height:44,borderRadius:'14px',bgcolor:'#f59e0b14',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #f59e0b22'}}>
                                <EmojiEvents sx={{color:'#f59e0b'}}/>
                            </Box>
                            <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>Monthly Performance</Typography>
                        </Stack>
                        <Grid container spacing={3}>
                            {[{label:'Attendance Rate',value:m.attendanceRate,color:colorPalette.seafoamGreen,icon:<CheckCircle sx={{fontSize:'1rem',color:colorPalette.seafoamGreen}}/>},{label:'Punctuality Rate',value:m.punctualityRate,color:colorPalette.aquaVibrant,icon:<EmojiEvents sx={{fontSize:'1rem',color:colorPalette.aquaVibrant}}/>},{label:'Hours Completion',value:m.totalHours&&m.presentDays?Math.min(((m.avgHoursPerDay/9)*100).toFixed(1),100):0,color:colorPalette.oceanBlue,icon:<AccessTime sx={{fontSize:'1rem',color:colorPalette.oceanBlue}}/>}]
                                .map(({label,value,color,icon})=>(
                                    <Grid item xs={12} sm={4} key={label}>
                                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>{icon}<Typography variant="body2" fontWeight={700} color="text.secondary">{label}</Typography><Typography variant="body2" fontWeight={900} color={color} sx={{ml:'auto !important'}}>{value}%</Typography></Stack>
                                        <LinearProgress variant="determinate" value={Math.min(Number(value),100)} sx={{height:8,borderRadius:99,bgcolor:`${color}14`,'& .MuiLinearProgress-bar':{bgcolor:color,borderRadius:99}}}/>
                                    </Grid>
                                ))}
                        </Grid>
                    </Box>
                </Reveal>
            )}

            {/* Records Table */}
            <Reveal>
                <Box sx={{...G.card,borderRadius:'22px',overflow:'hidden',position:'relative',zIndex:1}}>
                    <Stack direction={{xs:'column',sm:'row'}} justifyContent="space-between" alignItems={{xs:'stretch',sm:'center'}} sx={{px:{xs:2,md:3},pt:3,pb:2,gap:1.5}}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{width:38,height:38,borderRadius:'12px',bgcolor:`${colorPalette.deepNavy}10`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                <History sx={{color:colorPalette.deepNavy,fontSize:'1.2rem'}}/>
                            </Box>
                            <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>Attendance Records</Typography>
                            {!historyLoading&&<Chip label={`${filteredRows.length} records`} size="small" sx={{bgcolor:`${colorPalette.oceanBlue}12`,color:colorPalette.oceanBlue,fontWeight:700,fontSize:'0.7rem',borderRadius:'8px'}}/>}
                        </Stack>
                        <Button size="small" startIcon={<FilterList/>} onClick={()=>setShowFilters(p=>!p)}
                            sx={{borderRadius:'12px',textTransform:'none',fontWeight:700,fontSize:'0.8rem',background:showFilters?colorPalette.oceanGradient:'rgba(10,61,98,0.06)',color:showFilters?'#fff':colorPalette.deepNavy,border:showFilters?'none':'1px solid rgba(10,61,98,0.12)',transition:'all 0.2s ease'}}>
                            {showFilters?'Hide Filters':'Filters'}
                        </Button>
                    </Stack>
                    <Collapse in={showFilters}>
                        <Box sx={{px:{xs:2,md:3},pb:2.5}}>
                            <Box sx={{p:2,borderRadius:'14px',background:'rgba(10,61,98,0.04)',border:'1px solid rgba(10,61,98,0.08)'}}>
                                <Grid container spacing={2}>
                                    {[{label:'Status',val:filterStatus,set:setFilterStatus,items:['All','Present','Halfday','']},{label:'Timing',val:filterTiming,set:setFilterTiming,items:['All','Early','Late']}].map(({label,val,set,items})=>(
                                        <Grid item xs={12} sm={4} key={label}><TextField select fullWidth size="small" label={label} value={val} onChange={e=>{set(e.target.value);setPage(0);}} sx={G.input}>{items.map(v=><MenuItem key={v} value={v}>{v||'Pending'}</MenuItem>)}</TextField></Grid>
                                    ))}
                                    <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="month" label="Month" value={filterMonth} onChange={e=>{setFilterMonth(e.target.value);setPage(0);}} InputLabelProps={{shrink:true}} sx={G.input}/></Grid>
                                </Grid>
                            </Box>
                        </Box>
                    </Collapse>
                    <Divider sx={{borderColor:'rgba(10,61,98,0.07)'}}/>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{background:'rgba(10,61,98,0.04)'}}>
                                    {['Date','Clock In','Clock Out','Duration','Station','Timing','Status'].map(h=>(
                                        <TableCell key={h} sx={{fontWeight:900,fontSize:'0.72rem',color:colorPalette.deepNavy,letterSpacing:0.6,py:1.6,borderBottom:'1px solid rgba(10,61,98,0.08)'}}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historyLoading
                                    ?Array.from({length:6}).map((_,i)=><TableRow key={i}>{Array.from({length:7}).map((__,j)=><TableCell key={j} sx={{borderBottom:'1px solid rgba(10,61,98,0.05)'}}><Skeleton sx={{borderRadius:'8px'}}/></TableCell>)}</TableRow>)
                                    :paginatedRows.length===0
                                        ?<TableRow><TableCell colSpan={7} align="center" sx={{py:7,border:0}}><Stack alignItems="center" spacing={1.5}><Box sx={{width:68,height:68,borderRadius:'20px',bgcolor:'rgba(10,61,98,0.06)',display:'flex',alignItems:'center',justifyContent:'center'}}><History sx={{fontSize:36,color:'rgba(10,61,98,0.25)'}}/></Box><Typography variant="body2" color="text.disabled" fontWeight={600}>No records found</Typography><Button size="small" onClick={()=>{setFilterStatus('All');setFilterTiming('All');setFilterMonth('');}} sx={{textTransform:'none',color:colorPalette.oceanBlue,fontWeight:700,borderRadius:'10px',bgcolor:`${colorPalette.oceanBlue}08`,px:2}}>Clear filters</Button></Stack></TableCell></TableRow>
                                        :paginatedRows.map((row,idx)=>(
                                            <motion.tr key={idx} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:idx*0.025,duration:0.25,ease:'easeOut'}} style={{display:'table-row'}}>
                                                <TableCell sx={{fontWeight:700,color:colorPalette.deepNavy,whiteSpace:'nowrap',borderBottom:'1px solid rgba(10,61,98,0.05)','tr:last-child &':{border:0},'&:parent:hover':{background:'rgba(10,61,98,0.03)'}}}>{row.date}</TableCell>
                                                <TableCell sx={{fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap',color:'text.secondary',borderBottom:'1px solid rgba(10,61,98,0.05)'}}>{row.clockIn}</TableCell>
                                                <TableCell sx={{fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap',color:'text.secondary',borderBottom:'1px solid rgba(10,61,98,0.05)'}}>{row.clockOut}</TableCell>
                                                <TableCell sx={{fontVariantNumeric:'tabular-nums',borderBottom:'1px solid rgba(10,61,98,0.05)'}}>
                                                    {row.hours!=='—'?<Stack direction="row" alignItems="baseline" spacing={0.4}><Typography variant="body2" fontWeight={800} color={colorPalette.deepNavy}>{row.hours}</Typography><Typography variant="caption" color="text.disabled">hrs</Typography></Stack>:'—'}
                                                </TableCell>
                                                <TableCell sx={{borderBottom:'1px solid rgba(10,61,98,0.05)'}}><Typography variant="body2" color="text.secondary" noWrap sx={{maxWidth:140}}>{row.station}</Typography></TableCell>
                                                <TableCell sx={{borderBottom:'1px solid rgba(10,61,98,0.05)'}}><Chip label={row.timing} size="small" sx={{height:22,fontWeight:800,fontSize:'0.7rem',borderRadius:'8px',bgcolor:row.timing==='Early'?'#22c55e18':'#f9731618',color:row.timing==='Early'?'#16a34a':'#ea580c'}}/></TableCell>
                                                <TableCell sx={{borderBottom:'1px solid rgba(10,61,98,0.05)'}}><StatusPill label={row.status}/></TableCell>
                                            </motion.tr>
                                        ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination component="div" count={filteredRows.length} page={page} onPageChange={(_,p)=>setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={e=>{setRowsPerPage(parseInt(e.target.value,10));setPage(0);}} rowsPerPageOptions={[5,10,25,50,100]} sx={{borderTop:'1px solid rgba(10,61,98,0.07)',background:'rgba(10,61,98,0.02)','& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows':{fontSize:'0.8rem',color:'text.secondary'}}}/>
                </Box>
            </Reveal>
        </Box>
    );
}