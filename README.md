# 🛡️ Basechanfunder — Compliance & Proof of Funds Portal

<p align="center">
  <img src="apps/web-staff/public/logo.png" alt="Basechanfunder Logo" width="200" />
</p>

## 📖 What is Basechanfunder?

**Basechanfunder** is a specialized financial compliance ecosystem designed to help international students and visa applicants meet the rigorous **Proof of Funds (PoF)** requirements for global study destinations, such as the **UKVI 28-Day Rule**.

The platform automates the monitoring, verification, and mathematical validation of bank balances, ensuring that applicants maintain the required continuous holding period without the risk of accidental balance drops or FX volatility rejections.

---

## 📝 Brief Summary

Basechanfunder acts as a **bridge between local banking and international visa requirements**. It continuously ingests financial data via Open Banking, Native SMS Sync, and USSD, calculating real-time GBP values with safety buffers. It provides a structured workflow for students to submit documentation and for administrators to govern the compliance process.

---

## 🔍 Detailed Explanation of Use

The platform is built as a multi-role ecosystem, providing tailored experiences for Students, Counselors, and Administrators.

### 1. For Students: The Compliance Journey

The student experience is focused on simplicity and automation, typically accessed via the **Basechanfunder Android App**.

*   **Seamless Onboarding**: A high-depth, glassmorphic wizard guides students through setting up their profile, choosing a study destination (UK, Canada, Germany, USA, etc.), and defining their funding source (Self or Sponsored).
*   **Native Banking Sync**: Students connect their Nigerian bank accounts (e.g., Parallex, UBA, Zenith). The Android app uses a **Native SMS Engine** to parse official bank alerts in real-time, updating the ledger even when APIs are unavailable.
*   **The Document Vault**: A dedicated section for uploading required compliance documents like International Passports and Bank Statements. Supports PDF, Images, and Word documents with live upload tracking to Firebase Storage.
*   **Live Dashboard**: A "single source of truth" showing the current balance in GBP, the 28-day statutory holding progress, and a countdown to maturity.

### 2. For Administrators: Global Governance

Administrators control the "rules of the game" through a centralized governance console.

*   **Dynamic Rules Engine**: Configure global financial parameters, including FX Volatility Buffers (safety margins) and Destination-specific rules (e.g., the £1,334/mo requirement for the UK).
*   **Requirement Orchestrator**: Define a global master checklist of documents required from all students. Admins can apply user-level overrides to add specific requirements for individual students.
*   **Database Explorer & Archive Vault**: A professional-grade tool to inspect Firestore data. Includes a **7-Day Archive Vault** (Soft-Delete) that allows admins to disable accounts and restore them within a week before permanent purging.

### 3. For Counselors: Audit & Support

Counselors act as the human verification layer in the compliance process.

*   **Inspector View**: A high-density dashboard to monitor a roster of assigned students, track their daily balances, and flag potential capital breaches.
*   **Document Review**: A streamlined pipeline to download student-submitted files, verify their authenticity, and mark them as **APPROVED** or **REJECTED** with feedback.
*   **Support Desk**: An integrated messaging system for real-time communication between students and the compliance board.

---

## 🏗️ Project Architecture

```text
Basechanfunder/
├── apps/
│   ├── mobile-android/     # Kotlin Native App + WebView (SMS & Push Bridge)
│   ├── web-staff/          # React + TS Portal (Dashboards, Settings, Vault)
│   └── web-admin/          # React + TS Governance Console
├── apps/server/            # NestJS Backend (Admin API, Cron Purge Engine)
└── .artifacts/             # Implementation Plans & Documentation
```

## 🛠 Tech Stack

*   **Frontend**: React.js, Tailwind CSS, Framer Motion (Glassmorphism).
*   **Mobile**: Native Android (Kotlin) with WebKit Bridge.
*   **Backend**: NestJS, Go (Mathematical Engine).
*   **Infrastructure**: Firebase (Auth, Firestore, Storage, FCM), GitHub (APK Hosting).

---

## 🚀 Getting Started

To test the latest features, download the updated Android APK directly from our repository:
**[📲 Download Basechanfunder APK](https://github.com/johnnym5/basechanfunder/raw/main/apps/mobile-android/app/build/outputs/apk/debug/app-debug.apk)**

© 2026 Basechanfunder. Designed for high-stakes financial compliance.
