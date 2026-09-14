import {
  AccessibilityNewRounded,
  BadgeRounded,
  CheckCircleRounded,
  DevicesRounded,
  PhoneIphoneRounded,
  SecurityRounded,
} from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppNavbar, { useAccessibilityPrefs } from "./AppNavbar";
import GuideDialog from "./GuideDialog";

const CLOCKING_POINT_GUIDE_STEPS = [
  {
    title: "Use a registered clocking point",
    shortTitle: "Terminal",
    eyebrow: "Clocking terminal",
    body:
      "This page is for shared KMFRI Clocking Point terminals only. Confirm the station and clocking point name shown on the screen before serving staff, interns or attachees.",
    icon: DevicesRounded,
    hint: "If the terminal is not enrolled, attendance cannot be recorded from this device.",
  },
  {
    title: "Select the user's account category",
    shortTitle: "Category",
    eyebrow: "User identity",
    body:
      "Choose Staff, Intern or Attachee. The clocking point then asks for the correct identifier, either a staff number or ID number.",
    icon: BadgeRounded,
    hint: "Select the category first so the platform validates the correct record.",
  },
  {
    title: "Send and enter the OTP",
    shortTitle: "OTP",
    eyebrow: "One-time code",
    body:
      "After the identifier is accepted, the platform sends an OTP to the user's registered phone number. Enter the digits on the clocking point before the countdown ends.",
    icon: PhoneIphoneRounded,
    hint: "The screen shows only the masked phone ending for privacy.",
  },
  {
    title: "Confirm the automatic action",
    shortTitle: "Action",
    eyebrow: "Clock-in or clock-out",
    body:
      "When the OTP is verified, the clocking point records the next attendance action automatically. A user without an open record clocks in; a user with an open record clocks out.",
    icon: CheckCircleRounded,
    hint: "Wait for the success screen before clearing the next user.",
  },
  {
    title: "Keep accessibility available",
    shortTitle: "Access",
    eyebrow: "Accessibility",
    body:
      "Use the accessibility button in the navbar to adjust text size, contrast, motion, focus outlines, readable fonts and larger controls for this clocking point.",
    icon: AccessibilityNewRounded,
    hint: "These preferences stay available without changing the OTP clocking workflow.",
  },
];

export default function ClockingPointChrome({ children }) {
  const navigate = useNavigate();
  const [guideOpen, setGuideOpen] = useState(false);
  const [a11yPrefs, setA11yPrefs] = useAccessibilityPrefs();

  return (
    <>
      <AppNavbar
        variant="landing"
        onNavigate={() => navigate("/")}
        onOpenGuide={() => setGuideOpen(true)}
        guideLabel="Clocking Point Guide"
        a11yPrefs={a11yPrefs}
        setA11yPrefs={setA11yPrefs}
      />
      {children}
      <GuideDialog
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        steps={CLOCKING_POINT_GUIDE_STEPS}
        title="Clocking Point Guide"
        subtitle="OTP terminal guide for shared station clocking points"
        sidebarTitle="Clocking point"
        sidebarDescription="Select a step to review."
        guideIcon={SecurityRounded}
      />
    </>
  );
}
