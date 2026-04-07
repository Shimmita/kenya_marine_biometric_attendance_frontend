import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, Error, Warning, Schedule, Security, VerifiedUser, 
    Fingerprint, Description, GppGood, Shield, Policy
} from '@mui/icons-material';
import {
    Alert, Box, Chip, CircularProgress, Paper, Stack, Typography, Divider, Grid
} from '@mui/material';
import { verifyDocument } from '../service/VerificationService';
import coreDataDetails from './CoreDataDetails';

const { colorPalette } = coreDataDetails;

/* ══ OCEANIC GLASS TOKENS ══════════════════════════════════════════════════ */
const G = {
    cardStrong: { 
        background: 'rgba(255,255,255,0.95)', 
        backdropFilter: 'blur(20px)', 
        border: '1px solid #ffffff', 
        boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3)' 
    },
    // KMFRI Deep Sea Gradient
    heroBg: 'linear-gradient(180deg, #062c4d 0%, #041421 100%)',
};

const AmbientOrbs = () => (
    <Box sx={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {[{ s: 600, t: '-10%', l: '-10%', c: 'rgba(0,212,255,0.1)' }, 
          { s: 500, b: '5%', r: '5%', c: 'rgba(32,178,170,0.07)' }]
            .map((orb, i) => (
                <Box key={i} sx={{ position: 'absolute', width: orb.s, height: orb.s, top: orb.t, left: orb.l, right: orb.r, bottom: orb.b, borderRadius: '50%', background: orb.c, filter: 'blur(100px)' }} />
            ))}
    </Box>
);

const Reveal = ({ children, delay = 0 }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}>
            {children}
        </motion.div>
    );
};

const VerifyDocument = () => {
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const [verificationData, setVerificationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVerification = async () => {
            try {
                const dataHash = searchParams.get('hash');
                const data = await verifyDocument(token, dataHash);
                setVerificationData(data);
            } catch (err) {
                setError('Registry Connection Error');
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchVerification();
    }, [token, searchParams]);

    if (loading) return (
        <Box sx={{ minHeight: '100vh', background: G.heroBg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Stack spacing={3} alignItems="center">
                <CircularProgress thickness={2} size={60} sx={{ color: '#00d4ff' }} />
                <Typography sx={{ color: 'white', letterSpacing: 4, fontWeight: 300, opacity: 0.8 }}>
                    SCANNING KMFRI REGISTRY...
                </Typography>
            </Stack>
        </Box>
    );

    // LOGIC STATES
    const isValid = verificationData?.valid;
    const isTampered = isValid && verificationData?.contentMatch === false;
    const isExpired = verificationData?.expired;
    const isAuthentic = isValid && !isTampered && !isExpired;

    // Theme color based on authenticity
    const statusColor = isAuthentic ? colorPalette.seafoamGreen : 
                        isTampered ? '#ffa726' : colorPalette.coralSunset;

    return (
        <Box sx={{ minHeight: '100vh', background: G.heroBg, position: 'relative', overflowX: 'hidden' }}>
            <AmbientOrbs />

            {/* Top Branding Section */}
            <Box sx={{ pt: 5, pb: 2, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                    <Typography variant="overline" sx={{ color: '#00d4ff', letterSpacing: 8, fontWeight: 900 }}>
                        KMFRI SECURITY PROTOCOL
                    </Typography>
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 900, mt: 1 }}>
                        Attendance Verification
                    </Typography>
                </motion.div>
            </Box>

            <Box sx={{ maxWidth: '800px', mx: 'auto', px: 2, pb: 8, position: 'relative', zIndex: 2 }}>
                <AnimatePresence>
                    {error ? (
                        <Reveal>
                            <Alert severity="error" variant="filled" sx={{ borderRadius: '20px' }}>
                                <Typography fontWeight={700}>{error}</Typography>
                                <Typography variant="body2">System could not retrieve the record. Please try again later.</Typography>
                            </Alert>
                        </Reveal>
                    ) : (
                        <Stack spacing={4}>
                            {/* Main Document Card */}
                            <Reveal>
                                <Paper sx={{ ...G.cardStrong, borderRadius: '32px', p: 0, overflow: 'hidden' }}>
                                    {/* Verification Header Strip */}
                                    <Box sx={{ bgcolor: statusColor, p: 1.5, textAlign: 'center', transition: 'background 0.5s' }}>
                                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 900, letterSpacing: 2 }}>
                                            {isAuthentic ? 'OFFICIAL RECORD VERIFIED' : isTampered ? 'INTEGRITY ALERT' : 'INVALID DOCUMENT'}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ p: { xs: 4, md: 6 } }}>
                                        <Grid container spacing={4} alignItems="center">
                                            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                                                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                                                    <Box sx={{ 
                                                        width: 140, height: 140, borderRadius: '50%', mx: 'auto', 
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        border: `4px double ${statusColor}40`,
                                                        bgcolor: `${statusColor}08`,
                                                        color: statusColor
                                                    }}>
                                                        {isAuthentic ? <GppGood sx={{ fontSize: 80 }} /> : 
                                                         isTampered ? <Warning sx={{ fontSize: 80 }} /> : 
                                                         <Error sx={{ fontSize: 80 }} />}
                                                    </Box>
                                                </motion.div>
                                            </Grid>
                                            <Grid item xs={12} md={8}>
                                                <Typography variant="h4" fontWeight={900} color="#041421">
                                                    {isAuthentic ? 'Authentic Attendance' : isTampered ? 'Tampered Document' : 'Not Authentic'}
                                                </Typography>
                                                <Typography sx={{ color: 'text.secondary', mt: 1, mb: 3 }}>
                                                    {isAuthentic 
                                                        ? 'This report is verified as a genuine KMFRI attendance record.' 
                                                        : isTampered 
                                                        ? 'Warning: The digital footprint of this document has been modified.' 
                                                        : 'This token does not match any official research records.'}
                                                </Typography>
                                                <Stack direction="row" spacing={1}>
                                                    <Chip icon={<VerifiedUser sx={{ fontSize: '1rem !important' }} />} 
                                                          label={isAuthentic ? "Certified" : "Unverified"} 
                                                          sx={{ bgcolor: `${statusColor}15`, color: statusColor, fontWeight: 700 }} />
                                                    <Chip icon={<Schedule sx={{ fontSize: '1rem !important' }} />} 
                                                          label={new Date(verificationData?.createdAt).toLocaleDateString()} 
                                                          variant="outlined" />
                                                </Stack>
                                            </Grid>
                                        </Grid>

                                        <Divider sx={{ my: 4, opacity: 0.6 }} />

                                        {/* Attendance Details */}
                                        <Grid container spacing={3}>
                                            <Grid item xs={12} sm={6}>
                                                <InfoTile icon={<Policy />} label="Origin" value="KMFRI Headquarters" />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <InfoTile icon={<Description />} label="Report Category" value={verificationData?.type?.toUpperCase() || 'ATTENDANCE'} />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Box sx={{ bgcolor: '#f8fafb', p: 2, borderRadius: '16px', border: '1px solid #edf2f7' }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" gutterBottom>
                                                        SECURITY HASH (DIGITAL FINGERPRINT)
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', color: '#062c4d' }}>
                                                        {verificationData?.dataHash || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Paper>
                            </Reveal>

                            {/* Alert for Tampering */}
                            {isTampered && (
                                <Reveal delay={0.2}>
                                    <Alert severity="warning" variant="outlined" icon={<Warning fontSize="large" />}
                                           sx={{ borderRadius: '24px', bgcolor: 'rgba(255, 255, 255, 0.9)', border: `2px solid #ffa726` }}>
                                        <Typography fontWeight={800} color="#e65100">Integrity Breach Detected</Typography>
                                        <Typography variant="body2">The hash provided in the verification link does not match our master records. This document may have been altered since creation.</Typography>
                                    </Alert>
                                </Reveal>
                            )}

                            {/* Footer */}
                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ opacity: 0.5, color: 'white' }}>
                                <Shield sx={{ fontSize: 16 }} />
                                <Typography variant="caption">
                                    Official KMFRI Automated Verification Node
                                </Typography>
                            </Stack>
                        </Stack>
                    )}
                </AnimatePresence>
            </Box>
        </Box>
    );
};

const InfoTile = ({ icon, label, value }) => (
    <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ color: '#062c4d', bgcolor: '#f0f7ff', p: 1, borderRadius: '10px' }}>
            {icon}
        </Box>
        <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
            <Typography variant="body2" fontWeight={800} color="#041421">{value}</Typography>
        </Box>
    </Stack>
);

export default VerifyDocument;