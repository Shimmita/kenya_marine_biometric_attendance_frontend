import CallRounded from "@mui/icons-material/CallRounded";
import EmailRounded from "@mui/icons-material/EmailRounded";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FeedbackRounded from "@mui/icons-material/FeedbackRounded";
import PhoneRounded from "@mui/icons-material/PhoneRounded";
import SecurityRounded from "@mui/icons-material/SecurityRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Snackbar,
  Stack,
  Typography
} from "@mui/material";
import Rating from "@mui/material/Rating";
import { motion } from "framer-motion";
import { useState } from "react";
import { submitFeedback } from "../../service/FeedbackService";
import coreDataDetails from "../CoreDataDetails";

const { colorPalette } = coreDataDetails;

const HelpSupport = () => {
  const [openFeedback, setOpenFeedback] = useState(false);
  const [openContact, setOpenContact] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    overall: 0,
    easeOfUse: 0,
    responsiveness: 0,
    speed: 0,
    clocking: 0,
    uiDesign: 0,
    reliability: 0,
  });
  const [openSuccess, setOpenSuccess] = useState(false);
  const [expanded, setExpanded] = useState(true)
  const [loading, setLoading] = useState(false)


  const getRatingLabel = (value, max = 5) => {
    if (!value) return "";

    if (max === 10) {
      if (value <= 3) return { text: "Very Poor", color: "#ef4444" };
      if (value <= 5) return { text: "Fair", color: "#f97316" };
      if (value <= 7) return { text: "Good", color: "#eab308" };
      if (value <= 9) return { text: "Very Good", color: "#22c55e" };
      return { text: "Excellent", color: "#16a34a" };
    }

    // 1–5 scale
    switch (value) {
      case 1:
        return { text: "Very Poor", color: "#ef4444" };
      case 2:
        return { text: "Poor", color: "#f97316" };
      case 3:
        return { text: "Average", color: "#eab308" };
      case 4:
        return { text: "Good", color: "#22c55e" };
      case 5:
        return { text: "Excellent", color: "#16a34a" };
      default:
        return { text: "", color: "#6b7280" };
    }
  };



  return (
    <Box>

      {/* QUICK ACTION CARDS - NOW WIDER */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {[
          {
            title: "Give Feedback",
            subtitle: "Help us improve your digital experience",
            icon: <FeedbackRounded fontSize="large" />,
            color: "#f59e0b",
            action: () => setOpenFeedback(true),
          },
          {
            title: "Contact IT Support",
            subtitle: "Get help with technical issues or access",
            icon: <PhoneRounded fontSize="large" />,
            color: "#22c55e",
            action: () => setOpenContact(true),
          },
        ].map((item, i) => (
          <Grid item xs={12} md={6} key={i}> {/* Changed md={4} to md={6} for extra width */}
            <motion.div
              whileHover={{ y: -5, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                elevation={0}
                onClick={item.action}
                sx={{
                  borderRadius: 5,
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  border: `1px solid ${colorPalette.softGray}`,
                  background: `linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)`,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    borderColor: item.color,
                    boxShadow: `0 20px 40px ${item.color}15`,
                  },
                  // Decorative background glow
                  "&:after": {
                    content: '""',
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: `${item.color}10`,
                    zIndex: 0,
                  }
                }}
              >
                <CardContent sx={{ p: 4 }}> {/* Increased padding from default */}
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box
                      sx={{
                        width: 70, // Increased size
                        height: 70, // Increased size
                        borderRadius: 4,
                        bgcolor: `${item.color}12`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: item.color,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </Box>

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={900} sx={{ color: "#1f2937" }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.subtitle}
                      </Typography>
                    </Box>

                    {/* Subtle Arrow indicator */}
                    <Box sx={{ color: colorPalette.softGray, opacity: 0.5 }}>
                      <ExpandMoreIcon sx={{ transform: "rotate(-90deg)" }} />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* FAQ SECTION */}
      <Box mt={5}>
        <Typography gutterBottom variant="h6" fontWeight={900} mb={2}>
          Frequently Asked Questions
        </Typography>

        {[
          {
            q: "Why can't I clock in?",
            a: "Ensure location services are enabled and you are within the approved geofencing radius.",
          },
          {
            q: "How does geofencing verification work?",
            a: "The system validates your GPS coordinates against KMFRI’s registered perimeter before allowing attendance submission.",
          },
          {
            q: "What happens if I forget to clock out?",
            a: "You can request a correction under Attendance History, subject to supervisor approval.",
          },
          {
            q: "Can I edit a submitted leave request?",
            a: "Leave requests cannot be edited once submitted. You must cancel and resubmit if still pending.",
          },
          {
            q: "Why is my leave still pending?",
            a: "Your request is awaiting review from your assigned supervisor or HR officer.",
          },
          {
            q: "How do I reset my password?",
            a: "Use the 'Forgot Password' option on the login page to receive a reset link via email.",
          },
          {
            q: "How are public holidays and weekends handled?",
            a: "The system automatically recognizes gazetted public holidays. If you are required to work on these days, your supervisor must assign a special shift to your profile to enable clocking."
          },
          {
            q: "Does the system track my location throughout the day?",
            a: "No. For privacy integrity, the system only requests your GPS coordinates at the specific moment you press the 'Clock In' or 'Clock Out' buttons."
          },
          {
            q: "What is the difference between 'Pending', 'Approved', and 'Rejected' leave?",
            a: "Pending means it's awaiting supervisor review. Approved means your supervisor has agreed. Rejected means HR did not allow your leave request. You might need to contact him/her for further clarification."
          },
          {
            q: "Can I see my attendance records from last months?",
            a: "Yes. Use the date filter in the 'Attendance History' section to generate and download reports for any previous period."
          },

        ].map((faq, i) => (
          <Accordion
            expanded={expanded}
            onChange={() => setExpanded(prev => !prev)}
            key={i}
            elevation={0}
            sx={{
              border: `1px solid ${colorPalette.softGray}`,
              borderRadius: 3,
              p: 3,
              mb: 1.2,
              "&:before": { display: "none" },
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: colorPalette.oceanBlue,
                backgroundColor: `${colorPalette.oceanBlue}08`,
              },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={700}>{faq.q}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">{faq.a}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* SECURITY INFO */}
      <Box mt={5}>
        <Card elevation={0} sx={{ borderRadius: 4,p:3, border: `1px solid ${colorPalette.softGray}` }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <SecurityRounded sx={{ color: "#f59e0b" }} />
              <Box>
                <Typography gutterBottom fontWeight={800}>Security & Device Policy</Typography>
                <Typography variant="body2" color="text.secondary">
                  Sharing login credentials or trying to clock for another employee is strictly prohibited.
                  All activities are logged and monitored by the system for integrity and this may lead to your device being automatically flagged from clocking until you contact HR or your Supervisor.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

        {/* FEEDBACK SECTION */}
      <Dialog
        open={openFeedback}
        onClose={() => setOpenFeedback(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 5,
            padding: 1,
            background: "#f9fafb",
          },
        }}
      >
        <DialogTitle fontWeight={900} fontSize={20}>
          Rate Your Experience
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} mt={1}>

            {/* OVERALL RATING CARD */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: `1px solid ${colorPalette.softGray}`,
                background: "#ffffff",
                p: 2,
              }}
            >
              <Typography fontWeight={800}>
                Overall System Rating (1–10)
              </Typography>

              <Typography variant="body2" color="text.secondary" mb={2}>
                How satisfied are you with the overall performance of the system?
              </Typography>

              <Stack spacing={1}>
                <Rating
                  max={10}
                  value={feedbackData.overall}
                  onChange={(e, value) =>
                    setFeedbackData({ ...feedbackData, overall: value })
                  }
                  size="large"
                />

                {feedbackData.overall && (
                  <Typography
                    fontWeight={700}
                    sx={{
                      color: getRatingLabel(feedbackData.overall, 10).color,
                    }}
                  >
                    {getRatingLabel(feedbackData.overall, 10).text}
                  </Typography>
                )}
              </Stack>
            </Card>

            {/* SUB RATING CARDS */}
            {[
              {
                label: "Ease of Use",
                key: "easeOfUse",
                desc: "How simple and intuitive is the system to use?",
              },
              {
                label: "Responsiveness",
                key: "responsiveness",
                desc: "How quickly does the system respond to your actions?",
              },
              {
                label: "Speed & Performance",
                key: "speed",
                desc: "How fast does the system load and process tasks?",
              },
              {
                label: "Clocking Accuracy",
                key: "clocking",
                desc: "How accurate is the attendance and geofencing validation?",
              },
              {
                label: "Styling & UI Design",
                key: "uiDesign",
                desc: "How visually appealing and organized is the interface?",
              },
              {
                label: "System Reliability",
                key: "reliability",
                desc: "How stable and error-free is the system during use?",
              },
            ].map((item, index) => (
              <Card
                key={index}
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: `1px solid ${colorPalette.softGray}`,
                  background: "#ffffff",
                  p: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: colorPalette.oceanBlue,
                    boxShadow: `0 8px 20px ${colorPalette.oceanBlue}15`,
                  },
                }}
              >
                <Typography fontWeight={700}>
                  {item.label} (1–5)
                </Typography>

                <Typography variant="body2" color="text.secondary" mb={1.5}>
                  {item.desc}
                </Typography>

                <Stack spacing={1}>
                  <Rating
                    max={5}
                    value={feedbackData[item.key]}
                    onChange={(e, value) =>
                      setFeedbackData({ ...feedbackData, [item.key]: value })
                    }
                  />

                  {feedbackData[item.key] && (
                    <Typography
                      fontWeight={600}
                      sx={{
                        color: getRatingLabel(feedbackData[item.key]).color,
                      }}
                    >
                      {getRatingLabel(feedbackData[item.key]).text}
                    </Typography>
                  )}
                </Stack>
              </Card>
            ))}


          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenFeedback(false)}
            sx={{ borderRadius: 3 }}
          >
            Cancel
          </Button>


          <Button
            variant="contained"
            startIcon={loading && <CircularProgress size={10} />}
            disabled={Object.values(feedbackData).some((val) => !val || val < 1) || loading}
            sx={{
              borderRadius: 3,
              px: 3,
              fontWeight: 700,
            }}
            onClick={async () => {
              try {
                setLoading(true)
                await submitFeedback(feedbackData);
                setOpenFeedback(false);
                setOpenSuccess(true);
              } catch (err) {
                console.error(err);
              } finally {
                setLoading(false)
              }
            }}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openContact} onClose={() => setOpenContact(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={900}>Contact IT Support</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={1}>

            {/* PHONE NUMBERS */}
            <Box>
              <Typography fontWeight={700} mb={1}>
                Call Support
              </Typography>

              <Stack spacing={1}>
                <Button
                  startIcon={<CallRounded />}
                  onClick={() => {
                    window.location.href = "tel:+254700000000";
                    setOpenContact(false);
                  }}
                >
                  Main IT Desk – +254 700 000 000
                </Button>

                <Button
                  startIcon={<CallRounded />}
                  onClick={() => {
                    window.location.href = "tel:+254700000000";
                    setOpenContact(false);
                  }}
                >
                  HR Systems – +254 711 000 000
                </Button>
              </Stack>
            </Box>

            {/* EMAIL */}
            <Box>
              <Typography fontWeight={700} mb={1}>
                Email Support
              </Typography>

              <Button
                startIcon={<EmailRounded />}
                onClick={() => {
                  window.location.href =
                    "mailto:support@kmfri.go.ke?cc=hr@kmfri.go.ke,admin@kmfri.go.ke&subject=KMFRI%20Attendance%20Support%20Request";
                  setOpenContact(false);
                }}
              >
                Send Email
              </Button>
            </Box>

          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenContact(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSuccess}
        autoHideDuration={4000}
        onClose={() => setOpenSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenSuccess(false)}
          severity="success"
          variant="filled"
          sx={{ borderRadius: 3 }}
        >
          Thank you! Your feedback has been submitted successfully.
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default HelpSupport;