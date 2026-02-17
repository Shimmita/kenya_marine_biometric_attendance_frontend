import {
    AccessTime, Business, Download, EmojiEvents, Groups,
    LocationOn, QueryStats, Refresh, Shield, TrendingDown,
    TrendingUp, Warning, WorkHistory,
} from '@mui/icons-material';
import {
    Alert, Avatar, Box, Button, Chip, CircularProgress,
    Divider, Grid, LinearProgress, Skeleton, Snackbar,
    Stack, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography,
} from '@mui/material';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Bar, BarChart, CartesianGrid, Cell,
    Pie, PieChart, RadialBar, RadialBarChart,
    ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import { fetchOverallOrgStats } from '../../service/ClockingService';
import coreDataDetails from '../CoreDataDetails';

const { colorPalette } = coreDataDetails;

/* ══ GLASS TOKENS ══════════════════════════════════════════════════════════ */
const G = {
    card:       { background:'rgba(255,255,255,0.72)', backdropFilter:'blur(20px) saturate(180%)', WebkitBackdropFilter:'blur(20px) saturate(180%)', border:'1px solid rgba(255,255,255,0.60)', boxShadow:'0 4px 24px rgba(10,61,98,0.08), inset 0 1px 0 rgba(255,255,255,0.80)' },
    cardStrong: { background:'rgba(255,255,255,0.82)', backdropFilter:'blur(28px) saturate(200%)', WebkitBackdropFilter:'blur(28px) saturate(200%)', border:'1px solid rgba(255,255,255,0.72)', boxShadow:'0 8px 32px rgba(10,61,98,0.12), inset 0 1px 0 rgba(255,255,255,0.90)' },
    tile:       { background:'rgba(255,255,255,0.13)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.22)' },
    heroBg:     'linear-gradient(140deg, #061e30 0%, #0a3560 42%, #073a52 68%, #052840 100%)',
};

const safe = (v, s='') => (v!=null?`${v}${s}`:'—');
const RANK_LABELS = { admin:'Administrator', hr:'HR Manager', supervisor:'Supervisor', ceo:'Chief Executive Officer' };

/* ══ AMBIENT ORBS ══════════════════════════════════════════════════════════ */
const AmbientOrbs = () => (
    <>
        {[{s:440,t:-70,l:-120,c:'rgba(10,100,180,0.07)',b:75},{s:360,t:'38%',r:-90,c:'rgba(32,178,170,0.06)',b:60},{s:520,bot:-140,l:'25%',c:'rgba(10,61,98,0.05)',b:85}]
            .map(({s,t,l,r,bot,c,b},i)=>(
                <Box key={i} sx={{position:'absolute',width:s,height:s,pointerEvents:'none',zIndex:0,top:t,left:l,right:r,bottom:bot,borderRadius:'50%',background:c,filter:`blur(${b}px)`}}/>
            ))}
    </>
);

/* ══ SCROLL REVEAL ══════════════════════════════════════════════════════════ */
const Reveal = ({ children, delay=0, y=22 }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once:true, margin:'-50px' });
    return (
        <motion.div ref={ref} initial={{opacity:0,y}} animate={inView?{opacity:1,y:0}:{}}
            transition={{duration:0.55,delay,ease:[0.22,1,0.36,1]}}>
            {children}
        </motion.div>
    );
};

/* ══ GLASS TOOLTIP ══════════════════════════════════════════════════════════ */
const GlassTooltip = ({ active, payload, label }) => {
    if(!active||!payload?.length)return null;
    return (
        <Box sx={{background:'rgba(255,255,255,0.94)',backdropFilter:'blur(24px)',border:'1px solid rgba(10,61,98,0.12)',borderRadius:'14px',px:2,py:1.5,boxShadow:'0 10px 36px rgba(10,61,98,0.16)',minWidth:130}}>
            {label&&<Typography variant="caption" fontWeight={800} color={colorPalette.deepNavy} sx={{display:'block',mb:0.6}}>{label}</Typography>}
            {payload.map((p,i)=>(
                <Stack key={i} direction="row" alignItems="center" spacing={1} sx={{mt:0.3}}>
                    <Box sx={{width:8,height:8,borderRadius:'50%',bgcolor:p.color||p.fill,flexShrink:0}}/>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{p.name||p.dataKey}:</Typography>
                    <Typography variant="caption" fontWeight={900} color={colorPalette.deepNavy}>{p.value}{p.unit||''}</Typography>
                </Stack>
            ))}
        </Box>
    );
};

/* ══ STAT CARD ══════════════════════════════════════════════════════════════ */
const StatCard = ({ label, value, subtitle, icon, accent, trend, trendLabel, progress }) => (
    <Box sx={{...G.card,p:2.5,height:'100%',borderRadius:'20px',position:'relative',overflow:'hidden',transition:'all 0.26s ease',
        '&:hover':{transform:'translateY(-5px)',boxShadow:`0 16px 42px rgba(10,61,98,0.16)`},
        '&::after':{content:'""',position:'absolute',top:0,left:0,right:0,height:3,borderRadius:'20px 20px 0 0',background:`linear-gradient(90deg,${accent},${accent}66)`},
        '&::before':{content:'""',position:'absolute',top:-24,right:-24,width:84,height:84,borderRadius:'50%',background:`${accent}10`,zIndex:0},
    }}>
        <Stack spacing={1.5} sx={{position:'relative',zIndex:1}}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{width:44,height:44,borderRadius:'14px',bgcolor:`${accent}14`,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${accent}22`}}>{icon}</Box>
                {trend!=null&&<Chip size="small" icon={trend>=0?<TrendingUp sx={{fontSize:'0.78rem !important',color:'#22c55e !important'}}/>:<TrendingDown sx={{fontSize:'0.78rem !important',color:'#ef4444 !important'}}/>} label={trendLabel||`${Math.abs(trend)}%`} sx={{height:22,fontSize:'0.7rem',fontWeight:800,bgcolor:trend>=0?'#22c55e18':'#ef444418',color:trend>=0?'#16a34a':'#dc2626',borderRadius:'8px','& .MuiChip-label':{px:0.8}}}/>}
            </Stack>
            <Box>
                <Typography variant="h4" fontWeight={900} sx={{color:accent,lineHeight:1,fontVariantNumeric:'tabular-nums'}}>{value??<Skeleton width={60}/>}</Typography>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{textTransform:'uppercase',letterSpacing:0.8,display:'block',mt:0.3}}>{label}</Typography>
                {subtitle&&<Typography variant="caption" color="text.disabled" display="block" sx={{mt:0.2}}>{subtitle}</Typography>}
            </Box>
            {progress!=null&&<Box><LinearProgress variant="determinate" value={Math.min(Number(progress),100)} sx={{height:6,borderRadius:99,bgcolor:`${accent}14`,'& .MuiLinearProgress-bar':{bgcolor:accent,borderRadius:99}}}/><Typography variant="caption" color="text.disabled" sx={{mt:0.4,display:'block'}}>{Number(progress).toFixed(1)}%</Typography></Box>}
        </Stack>
    </Box>
);

/* ══ HERO BANNER ════════════════════════════════════════════════════════════ */
const OrgHeroBanner = ({ data, loading, rank }) => {
    const ov = data?.overview;
    return (
        <Box sx={{borderRadius:'24px',background:G.heroBg,position:'relative',overflow:'hidden',mb:3,p:{xs:3,md:4}}}>
            <Box sx={{position:'absolute',top:-60,right:-60,width:230,height:230,borderRadius:'50%',background:'rgba(0,180,200,0.10)',filter:'blur(45px)',pointerEvents:'none'}}/>
            <Box sx={{position:'absolute',bottom:-90,left:-90,width:290,height:290,borderRadius:'50%',background:'rgba(10,61,98,0.28)',filter:'blur(55px)',pointerEvents:'none'}}/>
            <Box sx={{position:'absolute',top:'35%',left:'45%',width:190,height:190,borderRadius:'50%',background:'rgba(0,220,255,0.06)',filter:'blur(36px)',pointerEvents:'none'}}/>
            <Grid container spacing={3} alignItems="center" sx={{position:'relative',zIndex:1}}>
                <Grid item xs={12} md={5}>
                    <Stack direction="row" alignItems="center" spacing={0.8} mb={0.5}>
                        <Shield sx={{fontSize:'0.85rem',color:'rgba(255,255,255,0.55)'}}/>
                        <Typography variant="caption" sx={{opacity:0.55,fontWeight:900,letterSpacing:2.2,textTransform:'uppercase',fontSize:'0.66rem',color:'#fff'}}>
                            {RANK_LABELS[rank]||'Admin'} · Org Dashboard
                        </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{opacity:0.52,fontWeight:900,letterSpacing:2,textTransform:'uppercase',display:'block',mb:0.5,color:'#fff'}}>
                        {new Date().toLocaleString('default',{month:'long',year:'numeric'})}
                    </Typography>
                    <Stack direction="row" alignItems="baseline" spacing={1.5} mt={0.5}>
                        <motion.div initial={{scale:0.4,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:0.7,ease:[0.22,1,0.36,1]}}>
                            <Typography variant="h2" fontWeight={900} sx={{fontSize:{xs:'3rem',md:'4.2rem'},lineHeight:1,fontVariantNumeric:'tabular-nums',color:'#fff',textShadow:'0 4px 24px rgba(0,0,0,0.28)'}}>
                                {loading?'—':safe(ov?.averageStaffEfficiency)}
                            </Typography>
                        </motion.div>
                        <Typography variant="h6" sx={{opacity:0.65,color:'#fff'}}>Efficiency</Typography>
                    </Stack>
                    <motion.div initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{delay:0.3,duration:0.5}}>
                        <Stack direction="row" alignItems="center" spacing={0.8} mt={1}>
                            <TrendingUp sx={{fontSize:'1rem',color:'#00e5ff',opacity:0.8}}/>
                            <Typography variant="body2" sx={{color:'rgba(255,255,255,0.72)'}}>
                                {loading?'Loading stats…':`${ov?.activeStaffThisMonth??0} of ${ov?.totalStaff??0} staff active this month`}
                            </Typography>
                        </Stack>
                    </motion.div>
                </Grid>
                <Grid item xs={12} md={7}>
                    <Grid container spacing={1.8}>
                        {[{label:'Total Staff',val:ov?.totalStaff},{label:'Active Staff',val:ov?.activeStaffThisMonth},{label:'Org Hours',val:ov?.totalOrgHours?`${ov.totalOrgHours}h`:'—'},{label:'Overtime',val:ov?.totalOrgOvertime?`${ov.totalOrgOvertime}h`:'—'}]
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
};

const SectionLabel = ({ children, accent, chip, chipColor }) => (
    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Box sx={{width:4,height:18,borderRadius:2,bgcolor:accent}}/>
        <Typography variant="subtitle1" fontWeight={800} color={colorPalette.deepNavy}>{children}</Typography>
        {chip&&<Chip label={chip} size="small" sx={{bgcolor:`${chipColor||accent}14`,color:chipColor||accent,fontWeight:700,fontSize:'0.7rem',borderRadius:'8px'}}/>}
    </Stack>
);

/* ══ ORG CHART SECTION ══════════════════════════════════════════════════════ */
const OrgChartSection = ({ data }) => {
    const ov    = data?.overview;
    const depts = data?.departmentBreakdown || [];

    /* ── Radial efficiency gauge data ── */
    const effNum    = ov?.averageStaffEfficiency ? parseFloat(ov.averageStaffEfficiency) : 0;
    const activePct = ov?.totalStaff ? +((ov.activeStaffThisMonth/ov.totalStaff)*100).toFixed(1) : 0;

    const radialData = [
        { name:'Efficiency', value:Math.min(effNum,100), fill:`url(#effGrad)` },
        { name:'Activation', value:Math.min(activePct,100), fill:`url(#actGrad)` },
    ];

    /* ── Dept hours horizontal bar ── */
    const deptBarData = [...depts]
        .sort((a,b)=>(parseFloat(b.totalHours)||0)-(parseFloat(a.totalHours)||0))
        .slice(0,8)
        .map(d=>({name:d.name?.length>14?d.name.slice(0,13)+'…':d.name, hours:parseFloat(d.totalHours)||0, headcount:d.headcount||0, avg:d.headcount?(parseFloat(d.totalHours)/d.headcount).toFixed(1):0 }));

    /* ── Status composition donut (active vs burnout vs absent) ── */
    const compositionData = [
        { name:'Active & Efficient', value:Math.max(0,(ov?.activeStaffThisMonth||0)-(data?.healthSignals?.burnoutRiskCount||0)), fill:`url(#compGreen)` },
        { name:'Burnout Risk',       value:data?.healthSignals?.burnoutRiskCount||0,                                              fill:`url(#compRed)`   },
        { name:'Inactive',           value:Math.max(0,(ov?.totalStaff||0)-(ov?.activeStaffThisMonth||0)),                        fill:`url(#compGrey)`  },
    ].filter(d=>d.value>0);

    const DEPT_COLORS = [colorPalette.oceanBlue, colorPalette.aquaVibrant, colorPalette.seafoamGreen, '#f59e0b', colorPalette.coralSunset, '#6366f1', '#ec4899', '#14b8a6'];

    const DonutCenter = ({cx,cy,total}) => (
        <>
            <text x={cx} y={cy-6} textAnchor="middle" dominantBaseline="central" fill={colorPalette.deepNavy} fontSize={20} fontWeight={900}>{total}</text>
            <text x={cx} y={cy+12} textAnchor="middle" dominantBaseline="central" fill="#94a3b8" fontSize={9} fontWeight={700}>Staff</text>
        </>
    );

    const renderPctLabel = ({cx,cy,midAngle,innerRadius,outerRadius,percent})=>{
        if(percent<0.08)return null;
        const R=Math.PI/180; const r=innerRadius+(outerRadius-innerRadius)*0.56;
        return <text x={cx+r*Math.cos(-midAngle*R)} y={cy+r*Math.sin(-midAngle*R)} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={900}>{`${(percent*100).toFixed(0)}%`}</text>;
    };

    return (
        <Box mb={4} sx={{position:'relative',zIndex:1}}>
            <Reveal><SectionLabel accent={colorPalette.cyanFresh} chip="Interactive charts">Organisation Insights</SectionLabel></Reveal>
            <Grid container spacing={2.5}>

                {/* ── Staff Composition Donut ── */}
                <Grid item xs={12} md={4}>
                    <Reveal delay={0}>
                        <Box sx={{...G.card,borderRadius:'22px',p:2.8,height:'100%'}}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                <Box sx={{width:4,height:16,borderRadius:2,bgcolor:colorPalette.seafoamGreen}}/>
                                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Staff Composition</Typography>
                            </Stack>
                            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>Active vs burnout risk vs inactive</Typography>
                            <Box sx={{position:'relative'}}>
                                <ResponsiveContainer width="100%" height={210}>
                                    <PieChart>
                                        <defs>
                                            <linearGradient id="compGreen" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={colorPalette.seafoamGreen} stopOpacity={1}/><stop offset="100%" stopColor={colorPalette.aquaVibrant} stopOpacity={0.8}/></linearGradient>
                                            <linearGradient id="compRed"   x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={colorPalette.coralSunset} stopOpacity={1}/><stop offset="100%" stopColor="#f43f5e" stopOpacity={0.8}/></linearGradient>
                                            <linearGradient id="compGrey"  x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#94a3b8" stopOpacity={0.8}/><stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.6}/></linearGradient>
                                        </defs>
                                        <Pie data={compositionData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                                            paddingAngle={4} dataKey="value"
                                            animationBegin={200} animationDuration={1000}
                                            labelLine={false} label={renderPctLabel}
                                            stroke="rgba(255,255,255,0.6)" strokeWidth={3}>
                                            {compositionData.map((entry,i)=><Cell key={i} fill={entry.fill}/>)}
                                        </Pie>
                                        <RTooltip content={<GlassTooltip/>}/>
                                    </PieChart>
                                </ResponsiveContainer>
                                <Box sx={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none'}}>
                                    <Typography variant="h5" fontWeight={900} color={colorPalette.deepNavy} sx={{lineHeight:1}}>{ov?.totalStaff??'—'}</Typography>
                                    <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{fontSize:'0.67rem'}}>Staff</Typography>
                                </Box>
                            </Box>
                            <Stack spacing={0.9} mt={0.5}>
                                {compositionData.map((item,i)=>{
                                    const fillMap=['#22c55e',colorPalette.coralSunset,'#94a3b8'];
                                    return(
                                        <Stack key={item.name} direction="row" alignItems="center" justifyContent="space-between">
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Box sx={{width:11,height:11,borderRadius:'4px',bgcolor:fillMap[i]}}/>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>{item.name}</Typography>
                                            </Stack>
                                            <Typography variant="caption" fontWeight={900} color={colorPalette.deepNavy}>{item.value}</Typography>
                                        </Stack>
                                    );
                                })}
                            </Stack>
                        </Box>
                    </Reveal>
                </Grid>

                {/* ── Dept Hours Horizontal Bar ── */}
                <Grid item xs={12} md={8}>
                    <Reveal delay={0.07}>
                        <Box sx={{...G.card,borderRadius:'22px',p:2.8}}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                <Box sx={{width:4,height:16,borderRadius:2,bgcolor:colorPalette.oceanBlue}}/>
                                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Department Hours</Typography>
                                <Chip label="Top 8 by hours" size="small" sx={{height:20,fontSize:'0.65rem',fontWeight:700,bgcolor:`${colorPalette.oceanBlue}10`,color:colorPalette.oceanBlue,borderRadius:'6px'}}/>
                            </Stack>
                            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>Total hours logged per department this month</Typography>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={deptBarData} layout="vertical" margin={{top:4,right:50,left:4,bottom:0}}>
                                    <defs>
                                        {DEPT_COLORS.map((c,i)=>(
                                            <linearGradient key={i} id={`deptGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor={c} stopOpacity={0.85}/>
                                                <stop offset="100%" stopColor={c} stopOpacity={0.55}/>
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" horizontal={false}/>
                                    <XAxis type="number" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                                    <YAxis type="category" dataKey="name" tick={{fontSize:9.5,fill:'#64748b',fontWeight:700}} axisLine={false} tickLine={false} width={88}/>
                                    <RTooltip content={<GlassTooltip/>} cursor={{fill:'rgba(10,61,98,0.04)'}}/>
                                    <Bar dataKey="hours" radius={[0,8,8,0]} name="Total Hours" animationDuration={900} animationBegin={200}
                                        label={{position:'right',fontSize:9,fill:'#94a3b8',fontWeight:700,formatter:v=>`${v}h`}}>
                                        {deptBarData.map((_,i)=><Cell key={i} fill={`url(#deptGrad${i%DEPT_COLORS.length})`}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Reveal>
                </Grid>

                {/* ── Radial gauge: Efficiency & Activation ── */}
                <Grid item xs={12} md={5}>
                    <Reveal delay={0.12}>
                        <Box sx={{...G.card,borderRadius:'22px',p:2.8,height:'100%'}}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                <Box sx={{width:4,height:16,borderRadius:2,bgcolor:'#f59e0b'}}/>
                                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Org Performance Radials</Typography>
                            </Stack>
                            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>Efficiency & staff activation gauges</Typography>
                            <ResponsiveContainer width="100%" height={200}>
                                <RadialBarChart cx="50%" cy="50%" innerRadius={38} outerRadius={88} data={radialData} startAngle={180} endAngle={-180} barSize={20}>
                                    <defs>
                                        <linearGradient id="effGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={colorPalette.aquaVibrant} stopOpacity={1}/><stop offset="100%" stopColor={colorPalette.seafoamGreen} stopOpacity={0.8}/></linearGradient>
                                        <linearGradient id="actGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={colorPalette.oceanBlue} stopOpacity={1}/><stop offset="100%" stopColor={colorPalette.cyanFresh} stopOpacity={0.8}/></linearGradient>
                                    </defs>
                                    <RadialBar background={{fill:'rgba(10,61,98,0.06)'}} dataKey="value" cornerRadius={10} animationDuration={1200} animationBegin={300}/>
                                    <RTooltip content={<GlassTooltip/>}/>
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <Stack direction="row" justifyContent="space-around" mt={0.5}>
                                {[{label:'Efficiency',value:`${effNum.toFixed(1)}%`,color:colorPalette.aquaVibrant},{label:'Activation',value:`${activePct.toFixed(1)}%`,color:colorPalette.oceanBlue}]
                                    .map(({label,value,color})=>(
                                        <Box key={label} sx={{textAlign:'center'}}>
                                            <Typography variant="h6" fontWeight={900} sx={{color,fontVariantNumeric:'tabular-nums'}}>{value}</Typography>
                                            <Typography variant="caption" color="text.disabled" fontWeight={700}>{label}</Typography>
                                        </Box>
                                    ))}
                            </Stack>
                        </Box>
                    </Reveal>
                </Grid>

                {/* ── Dept avg-hrs-per-head bar (upright) ── */}
                <Grid item xs={12} md={7}>
                    <Reveal delay={0.17}>
                        <Box sx={{...G.card,borderRadius:'22px',p:2.8}}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                <Box sx={{width:4,height:16,borderRadius:2,bgcolor:colorPalette.coralSunset}}/>
                                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Avg Hours per Head</Typography>
                                <Chip label="By department" size="small" sx={{height:20,fontSize:'0.65rem',fontWeight:700,bgcolor:`${colorPalette.coralSunset}12`,color:colorPalette.coralSunset,borderRadius:'6px'}}/>
                            </Stack>
                            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>Average hours clocked per staff member this month</Typography>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={deptBarData} margin={{top:4,right:4,left:-22,bottom:20}} barCategoryGap="32%">
                                    <defs>
                                        <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={colorPalette.coralSunset} stopOpacity={0.9}/>
                                            <stop offset="100%" stopColor="#f97316" stopOpacity={0.6}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false}/>
                                    <XAxis dataKey="name" tick={{fontSize:9,fill:'#94a3b8',fontWeight:600}} axisLine={false} tickLine={false} angle={-28} textAnchor="end" height={44}/>
                                    <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                                    <RTooltip content={<GlassTooltip/>} cursor={{fill:'rgba(10,61,98,0.04)',radius:[4,4,0,0]}}/>
                                    <Bar dataKey="avg" fill="url(#avgGrad)" radius={[7,7,0,0]} name="Avg hrs/head" animationDuration={900} animationBegin={300}/>
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
export default function OverallAttendanceStats() {
    const { user }  = useSelector(s=>s.currentUser);
    const [data,     setData]     = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [exporting,setExporting]= useState(false);
    const [snack,    setSnack]    = useState({open:false,message:'',severity:'success'});

    const notify = (msg,sev='success') => setSnack({open:true,message:msg,severity:sev});

    const loadData = async () => {
        setLoading(true);
        try { const res=await fetchOverallOrgStats(); setData(res); }
        catch { notify('Failed to load organisation data.','error'); }
        finally { setLoading(false); }
    };

    useEffect(()=>{loadData();},[]);// eslint-disable-line

    const ov     = data?.overview;
    const hs     = data?.healthSignals;
    const depts  = data?.departmentBreakdown||[];
    const topPerfs=data?.topPerformers||[];
    const effNum  = ov?.averageStaffEfficiency?parseFloat(ov.averageStaffEfficiency):0;
    const activationPct = ov?.totalStaff?+((ov.activeStaffThisMonth/ov.totalStaff)*100).toFixed(1):0;
    const deptMaxHours  = depts.length?Math.max(...depts.map(d=>parseFloat(d.totalHours)||0),1):1;

    const overviewCards=[
        {label:'Total Staff',      value:safe(ov?.totalStaff),                                   subtitle:'All registered users',  icon:<Groups     sx={{color:colorPalette.oceanBlue,   fontSize:'1.3rem'}}/>, accent:colorPalette.oceanBlue},
        {label:'Active This Month',value:safe(ov?.activeStaffThisMonth),                         subtitle:'Clocked in ≥1 day',     icon:<TrendingUp sx={{color:colorPalette.seafoamGreen,fontSize:'1.3rem'}}/>, accent:colorPalette.seafoamGreen, progress:activationPct},
        {label:'Org Total Hours',  value:ov?.totalOrgHours?`${ov.totalOrgHours}h`:'—',          subtitle:'Combined man-hours',    icon:<AccessTime sx={{color:colorPalette.aquaVibrant, fontSize:'1.3rem'}}/>, accent:colorPalette.aquaVibrant, progress:effNum},
        {label:'Org Overtime',     value:ov?.totalOrgOvertime?`${ov.totalOrgOvertime}h`:'—',    subtitle:'Total excess hours',    icon:<WorkHistory sx={{color:'#f59e0b',               fontSize:'1.3rem'}}/>, accent:'#f59e0b'},
    ];
    const healthCards=[
        {label:'Burnout Risk Staff',value:safe(hs?.burnoutRiskCount),     subtitle:'>20h overtime',           icon:<Warning    sx={{color:colorPalette.coralSunset, fontSize:'1.3rem'}}/>, accent:colorPalette.coralSunset},
        {label:'Busiest Department',value:hs?.chronicLatenessDept||'—',  subtitle:'Highest hours recorded',  icon:<Business   sx={{color:colorPalette.aquaVibrant, fontSize:'1.3rem'}}/>, accent:colorPalette.aquaVibrant},
        {label:'Most Active Station',value:hs?.mostActiveStation||'—',   subtitle:'Most check-ins',          icon:<LocationOn sx={{color:colorPalette.seafoamGreen,fontSize:'1.3rem'}}/>, accent:colorPalette.seafoamGreen},
        {label:'Avg Efficiency',    value:safe(ov?.averageStaffEfficiency),subtitle:'vs 160h standard month',icon:<EmojiEvents sx={{color:'#f59e0b',               fontSize:'1.3rem'}}/>, accent:'#f59e0b', progress:effNum},
    ];

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            const {default:jsPDF}=await import('jspdf'); const {default:autoTable}=await import('jspdf-autotable');
            const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}); const pw=doc.internal.pageSize.getWidth();
            doc.setFillColor(10,61,98); doc.rect(0,0,pw,30,'F'); doc.setTextColor(255,255,255);
            doc.setFontSize(16);doc.setFont('helvetica','bold');doc.text('Kenya Marine and Fisheries Research Institute',pw/2,10,{align:'center'});
            doc.setFontSize(12);doc.setFont('helvetica','normal');doc.text('Organisation Attendance Report — '+new Date().toLocaleString('default',{month:'long',year:'numeric'}),pw/2,18,{align:'center'});
            doc.setFontSize(8.5);doc.text(`Generated: ${new Date().toLocaleString()}  |  By: ${user?.name||'N/A'}  |  Role: ${RANK_LABELS[user?.rank]||user?.rank||'Admin'}`,pw/2,26,{align:'center'});
            const sy=36;
            const boxes=[['Total Staff',safe(ov?.totalStaff)],['Active Staff',safe(ov?.activeStaffThisMonth)],['Org Hours',safe(ov?.totalOrgHours,'h')],['Overtime',safe(ov?.totalOrgOvertime,'h')],['Efficiency',safe(ov?.averageStaffEfficiency)],['Burnout Risks',safe(hs?.burnoutRiskCount)]];
            const bw=(pw-20)/boxes.length;
            boxes.forEach(([lbl,val],i)=>{const x=10+i*bw;doc.setFillColor(245,248,252);doc.roundedRect(x,sy,bw-2,16,2,2,'F');doc.setTextColor(10,61,98);doc.setFontSize(12);doc.setFont('helvetica','bold');doc.text(val,x+bw/2-1,sy+7,{align:'center'});doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(100,116,139);doc.text(lbl,x+bw/2-1,sy+13,{align:'center'});});
            if(depts.length){doc.setFontSize(10);doc.setFont('helvetica','bold');doc.setTextColor(10,61,98);doc.text('Department Breakdown',10,sy+24);autoTable(doc,{head:[['Department','Headcount','Total Hours','Avg Hrs/Head']],body:depts.map(d=>[d.name,d.headcount,`${d.totalHours}h`,d.headcount?(parseFloat(d.totalHours)/d.headcount).toFixed(1)+'h':'—']),startY:sy+28,styles:{fontSize:8.5,cellPadding:2.5},headStyles:{fillColor:[10,61,98],textColor:255,fontStyle:'bold'},alternateRowStyles:{fillColor:[248,250,252]},columnStyles:{0:{fontStyle:'bold'}}});}
            if(topPerfs.length){const ay=(doc.lastAutoTable?.finalY??sy+60)+10;doc.setFontSize(10);doc.setFont('helvetica','bold');doc.setTextColor(10,61,98);doc.text('Top Performers',10,ay);autoTable(doc,{head:[['Rank','Email','Score']],body:topPerfs.map((p,i)=>[`#${i+1}`,p.email,Math.round(p.score)]),startY:ay+4,styles:{fontSize:8.5,cellPadding:2.5},headStyles:{fillColor:[10,61,98],textColor:255,fontStyle:'bold'},alternateRowStyles:{fillColor:[248,250,252]}});}
            const tp=doc.internal.getNumberOfPages();
            for(let i=1;i<=tp;i++){doc.setPage(i);doc.setFontSize(7);doc.setTextColor(160,174,192);doc.text(`Page ${i} of ${tp}  |  KMFRI Digital Attendance Platform  |  Confidential — Admin Only`,pw/2,doc.internal.pageSize.getHeight()-5,{align:'center'});}
            doc.save(`KMFRI_OrgReport_${user?.name?.replace(/\s+/g,'_')||'Admin'}_${new Date().toISOString().split('T')[0]}.pdf`);
            notify('Organisation report exported!');
        } catch { notify('Export failed.','error'); }
        finally { setExporting(false); }
    };

    return (
        <Box sx={{width:'100%',maxWidth:1200,mx:'auto',position:'relative'}}>
            <AmbientOrbs/>
            <Snackbar open={snack.open} autoHideDuration={5000} onClose={()=>setSnack(s=>({...s,open:false}))} anchorOrigin={{vertical:'top',horizontal:'center'}}>
                <Alert severity={snack.severity} variant="filled" elevation={6} onClose={()=>setSnack(s=>({...s,open:false}))} sx={{borderRadius:'14px',fontWeight:700,backdropFilter:'blur(16px)'}}>{snack.message}</Alert>
            </Snackbar>

            <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
                <OrgHeroBanner data={data} loading={loading} rank={user?.rank}/>
            </motion.div>

            {/* Toolbar */}
            <Reveal>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2} sx={{position:'relative',zIndex:1}}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <QueryStats sx={{color:colorPalette.deepNavy}}/>
                        <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy}>Organisation Statistics</Typography>
                        <Chip label={new Date().toLocaleString('default',{month:'long',year:'numeric'})} size="small" sx={{bgcolor:`${colorPalette.oceanBlue}12`,color:colorPalette.oceanBlue,fontWeight:700,fontSize:'0.7rem',borderRadius:'8px'}}/>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Chip label={RANK_LABELS[user?.rank]||'Admin'} size="small" icon={<Shield sx={{fontSize:'0.78rem !important',color:`${colorPalette.aquaVibrant} !important`}}/>} sx={{bgcolor:`${colorPalette.aquaVibrant}12`,color:colorPalette.deepNavy,fontWeight:700,fontSize:'0.7rem',border:`1px solid ${colorPalette.aquaVibrant}28`,borderRadius:'8px'}}/>
                        <Button variant="outlined" startIcon={loading?<CircularProgress size={13} sx={{color:colorPalette.deepNavy}}/>:<Refresh sx={{fontSize:'1rem'}}/>} onClick={loadData} disabled={loading} sx={{borderRadius:'12px',textTransform:'none',fontWeight:700,fontSize:'0.82rem',background:'rgba(255,255,255,0.72)',backdropFilter:'blur(12px)',borderColor:'rgba(10,61,98,0.15)',color:colorPalette.deepNavy,'&:hover':{borderColor:colorPalette.oceanBlue,bgcolor:'rgba(10,61,98,0.06)'}}}>Refresh</Button>
                        <Button variant="contained" startIcon={exporting?<CircularProgress size={14} sx={{color:'white'}}/>:<Download/>} onClick={handleExportPDF} disabled={exporting||loading} sx={{borderRadius:'12px',textTransform:'none',fontWeight:700,fontSize:'0.82rem',background:colorPalette.oceanGradient,boxShadow:`0 6px 20px ${colorPalette.oceanBlue}40`,transition:'all 0.22s','&:hover':{boxShadow:`0 8px 28px ${colorPalette.oceanBlue}55`,transform:'translateY(-1px)'}}}>{exporting?'Generating…':'Export Report'}</Button>
                    </Stack>
                </Stack>
            </Reveal>

            {/* Workforce Overview cards */}
            <Box mb={3} sx={{position:'relative',zIndex:1}}>
                <Reveal><SectionLabel accent={colorPalette.aquaVibrant} chip="Month-to-date" chipColor={colorPalette.oceanBlue}>Workforce Overview</SectionLabel></Reveal>
                <Grid container spacing={2}>
                    {overviewCards.map((c,i)=>(
                        <Grid item xs={6} sm={3} key={c.label}>
                            <Reveal delay={i*0.07}>{loading?<Skeleton variant="rounded" height={145} sx={{borderRadius:'20px'}}/>:<StatCard {...c}/>}</Reveal>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Health Signal cards */}
            <Box mb={4} sx={{position:'relative',zIndex:1}}>
                <Reveal><SectionLabel accent={colorPalette.coralSunset} chip="Automated insights" chipColor={colorPalette.coralSunset}>Health Signals</SectionLabel></Reveal>
                <Grid container spacing={2}>
                    {healthCards.map((c,i)=>(
                        <Grid item xs={6} sm={3} key={c.label}>
                            <Reveal delay={i*0.07}>{loading?<Skeleton variant="rounded" height={145} sx={{borderRadius:'20px'}}/>:<StatCard {...c}/>}</Reveal>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* CHARTS */}
            {!loading&&data&&<OrgChartSection data={data}/>}

            {/* Org performance panel */}
            {!loading&&ov&&(
                <Reveal>
                    <Box sx={{...G.cardStrong,borderRadius:'22px',p:{xs:2.5,md:3},mb:4,position:'relative',zIndex:1}}>
                        <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                            <Box sx={{width:44,height:44,borderRadius:'14px',bgcolor:'#f59e0b14',border:'1px solid #f59e0b22',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                <EmojiEvents sx={{color:'#f59e0b'}}/>
                            </Box>
                            <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>Organisational Performance</Typography>
                        </Stack>
                        <Grid container spacing={3}>
                            {[{label:'Staff Efficiency',value:effNum,color:colorPalette.seafoamGreen,icon:<TrendingUp sx={{fontSize:'1rem',color:colorPalette.seafoamGreen}}/>},{label:'Staff Activation',value:activationPct,color:colorPalette.oceanBlue,icon:<Groups sx={{fontSize:'1rem',color:colorPalette.oceanBlue}}/>}]
                                .map(({label,value,color,icon})=>(
                                    <Grid item xs={12} sm={4} key={label}>
                                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>{icon}<Typography variant="body2" fontWeight={700} color="text.secondary">{label}</Typography><Typography variant="body2" fontWeight={900} color={color} sx={{ml:'auto !important'}}>{Number(value).toFixed(1)}%</Typography></Stack>
                                        <LinearProgress variant="determinate" value={Math.min(Number(value),100)} sx={{height:8,borderRadius:99,bgcolor:`${color}14`,'& .MuiLinearProgress-bar':{bgcolor:color,borderRadius:99}}}/>
                                    </Grid>
                                ))}
                        </Grid>
                    </Box>
                </Reveal>
            )}

            {/* Dept table + Top Performers */}
            <Grid container spacing={3} sx={{position:'relative',zIndex:1}}>
                <Grid item xs={12} lg={7}>
                    <Reveal>
                        <Box sx={{...G.card,borderRadius:'22px',overflow:'hidden',height:'100%'}}>
                            <Stack direction={{xs:'column',sm:'row'}} justifyContent="space-between" alignItems={{xs:'stretch',sm:'center'}} sx={{px:{xs:2,md:3},pt:3,pb:2,gap:1.5}}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Box sx={{width:38,height:38,borderRadius:'12px',bgcolor:`${colorPalette.deepNavy}10`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                        <Business sx={{color:colorPalette.deepNavy,fontSize:'1.15rem'}}/>
                                    </Box>
                                    <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>Department Breakdown</Typography>
                                    {!loading&&<Chip label={`${depts.length} depts`} size="small" sx={{bgcolor:`${colorPalette.seafoamGreen}12`,color:colorPalette.seafoamGreen,fontWeight:700,fontSize:'0.7rem',borderRadius:'8px'}}/>}
                                </Stack>
                            </Stack>
                            <Divider sx={{borderColor:'rgba(10,61,98,0.07)'}}/>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{background:'rgba(10,61,98,0.04)'}}>
                                            {['Department','Headcount','Total Hours','Avg Hrs/Head','Load'].map(h=>(
                                                <TableCell key={h} sx={{fontWeight:900,fontSize:'0.72rem',color:colorPalette.deepNavy,letterSpacing:0.6,py:1.6,borderBottom:'1px solid rgba(10,61,98,0.08)'}}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading
                                            ?Array.from({length:5}).map((_,i)=><TableRow key={i}>{Array.from({length:5}).map((__,j)=><TableCell key={j} sx={{borderBottom:'1px solid rgba(10,61,98,0.05)'}}><Skeleton sx={{borderRadius:'8px'}}/></TableCell>)}</TableRow>)
                                            :depts.length===0
                                                ?<TableRow><TableCell colSpan={5} align="center" sx={{py:7,border:0}}><Stack alignItems="center" spacing={1.5}><Box sx={{width:64,height:64,borderRadius:'20px',bgcolor:'rgba(10,61,98,0.06)',display:'flex',alignItems:'center',justifyContent:'center'}}><Business sx={{fontSize:34,color:'rgba(10,61,98,0.25)'}}/></Box><Typography variant="body2" color="text.disabled" fontWeight={600}>No department data</Typography></Stack></TableCell></TableRow>
                                                :depts.map((dept,idx)=>{
                                                    const hrs=parseFloat(dept.totalHours)||0;
                                                    const avg=dept.headcount?(hrs/dept.headcount).toFixed(1):'—';
                                                    const loadPct=Math.min((hrs/deptMaxHours)*100,100);
                                                    return(
                                                        <motion.tr key={idx} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:idx*0.04,duration:0.28}} style={{display:'table-row'}}>
                                                            <TableCell sx={{fontWeight:700,color:colorPalette.deepNavy,borderBottom:'1px solid rgba(10,61,98,0.05)'}}>{dept.name}</TableCell>
                                                            <TableCell sx={{borderBottom:'1px solid rgba(10,61,98,0.05)'}}><Chip label={dept.headcount} size="small" sx={{height:22,fontWeight:800,fontSize:'0.7rem',borderRadius:'8px',bgcolor:`${colorPalette.oceanBlue}10`,color:colorPalette.oceanBlue}}/></TableCell>
                                                            <TableCell sx={{fontVariantNumeric:'tabular-nums',fontWeight:700,borderBottom:'1px solid rgba(10,61,98,0.05)'}}>{dept.totalHours}h</TableCell>
                                                            <TableCell sx={{fontVariantNumeric:'tabular-nums',borderBottom:'1px solid rgba(10,61,98,0.05)'}}>{avg}h</TableCell>
                                                            <TableCell sx={{minWidth:110,borderBottom:'1px solid rgba(10,61,98,0.05)'}}>
                                                                <LinearProgress variant="determinate" value={loadPct} sx={{height:7,borderRadius:99,bgcolor:`${colorPalette.seafoamGreen}14`,'& .MuiLinearProgress-bar':{bgcolor:colorPalette.seafoamGreen,borderRadius:99}}}/>
                                                                <Typography variant="caption" color="text.disabled" sx={{mt:0.3,display:'block',fontSize:'0.64rem'}}>{loadPct.toFixed(0)}%</Typography>
                                                            </TableCell>
                                                        </motion.tr>
                                                    );
                                                })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Reveal>
                </Grid>

                {/* Top Performers */}
                <Grid item xs={12} lg={5}>
                    <Reveal delay={0.08}>
                        <Box sx={{...G.card,borderRadius:'22px',p:3,height:'100%'}}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
                                <Box sx={{width:44,height:44,borderRadius:'14px',bgcolor:'#f59e0b14',border:'1px solid #f59e0b22',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                    <EmojiEvents sx={{color:'#f59e0b'}}/>
                                </Box>
                                <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>Top Performers</Typography>
                                <Chip label="By attendance score" size="small" sx={{bgcolor:'#f59e0b12',color:'#d97706',fontWeight:700,fontSize:'0.68rem',borderRadius:'8px'}}/>
                            </Stack>

                            {loading
                                ?<Stack spacing={1.5}>{Array.from({length:5}).map((_,i)=><Skeleton key={i} variant="rounded" height={64} sx={{borderRadius:'14px'}}/>)}</Stack>
                                :topPerfs.length===0
                                    ?<Box sx={{textAlign:'center',py:5}}><Box sx={{width:64,height:64,borderRadius:'20px',bgcolor:'rgba(10,61,98,0.05)',display:'flex',alignItems:'center',justifyContent:'center',mx:'auto',mb:1.5}}><EmojiEvents sx={{fontSize:34,color:'rgba(10,61,98,0.2)'}}/></Box><Typography variant="body2" color="text.disabled" fontWeight={600}>No performer data available</Typography></Box>
                                    :<Stack spacing={1.4}>
                                        {topPerfs.map((p,idx)=>{
                                            const medals=['🥇','🥈','🥉'];
                                            const rs=[
                                                {bg:'rgba(254,243,199,0.82)',border:'rgba(253,230,138,0.72)',color:'#d97706'},
                                                {bg:'rgba(241,245,249,0.82)',border:'rgba(226,232,240,0.72)',color:'#64748b'},
                                                {bg:'rgba(255,247,237,0.82)',border:'rgba(254,215,170,0.72)',color:'#c2410c'},
                                            ][idx]||{bg:`${colorPalette.oceanBlue}08`,border:`${colorPalette.oceanBlue}22`,color:colorPalette.oceanBlue};
                                            const emailLocal=p.email?.split('@')[0]||'??';
                                            return(
                                                <motion.div key={idx} initial={{opacity:0,x:14}} animate={{opacity:1,x:0}} transition={{delay:idx*0.07,ease:[0.22,1,0.36,1]}}>
                                                    <Box sx={{p:1.8,borderRadius:'14px',background:rs.bg,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:`1px solid ${rs.border}`,transition:'all 0.18s ease','&:hover':{transform:'translateX(4px)',boxShadow:'0 6px 20px rgba(10,61,98,0.10)'}}}>
                                                        <Stack direction="row" alignItems="center" spacing={1.6}>
                                                            <Typography sx={{fontSize:'1.45rem',lineHeight:1,flexShrink:0}}>{medals[idx]||`#${idx+1}`}</Typography>
                                                            <Avatar sx={{width:36,height:36,bgcolor:colorPalette.deepNavy,color:'#fff',fontSize:'0.73rem',fontWeight:800,flexShrink:0}}>{emailLocal.slice(0,2).toUpperCase()}</Avatar>
                                                            <Box sx={{flex:1,minWidth:0}}>
                                                                <Typography variant="body2" fontWeight={800} color={colorPalette.deepNavy} noWrap sx={{fontSize:'0.83rem'}}>{emailLocal}</Typography>
                                                                <Typography variant="caption" color="text.disabled" noWrap sx={{fontSize:'0.67rem'}}>{p.email}</Typography>
                                                            </Box>
                                                            <Box sx={{textAlign:'right',flexShrink:0}}>
                                                                <Typography variant="body2" fontWeight={900} sx={{color:rs.color,fontVariantNumeric:'tabular-nums'}}>{Math.round(p.score)}</Typography>
                                                                <Typography variant="caption" color="text.disabled" sx={{fontSize:'0.62rem'}}>pts</Typography>
                                                            </Box>
                                                        </Stack>
                                                    </Box>
                                                </motion.div>
                                            );
                                        })}
                                    </Stack>
                            }

                            {!loading&&topPerfs.length>0&&(
                                <Box sx={{mt:2,p:1.8,borderRadius:'12px',background:'rgba(10,61,98,0.04)',border:'1px dashed rgba(10,61,98,0.12)'}}>
                                    <Typography variant="caption" color="text.disabled" sx={{fontSize:'0.65rem',lineHeight:1.65,display:'block'}}>
                                        <strong style={{color:colorPalette.deepNavy}}>Score:</strong>{' '}(Hours × 0.6) + (Early arrivals × 2) − (Late arrivals × 1)
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Reveal>
                </Grid>
            </Grid>
        </Box>
    );
}