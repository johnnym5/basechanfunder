import { HelpSection } from './studentHelpData';

export const ADMIN_HELP_CATEGORIES = [
  'All Topics',
  'Governance Roster Management',
  'Document Inspection & Approval',
  'Top-Up Request Processing',
  'User Management & Cascading Deletion',
  'Admin Action Glossary'
];

export const ADMIN_HELP_DATA: HelpSection[] = [
  {
    id: 'roster-management',
    category: 'Governance Roster Management',
    title: 'Governance Roster Management & Status Lifecycle',
    description:
      'Manage student onboarding lifecycles, monitor compliance states, and utilize filtering to isolate compliance bottlenecks.',
    tags: ['roster', 'students', 'cleared', 'topup_pending', 'incomplete', 'unauthenticated', 'filter', 'counselor', 'governance'],
    bulletPoints: [
      'CLEARED Status Pill: Denotes students who have completed all 5 mandatory document stages, satisfied minimum PoF thresholds, and passed counselor review.',
      'TOPUP_PENDING Status Pill: Indicates an active, unapproved capital top-up request awaiting administrative verification of the 2.5% service fee.',
      'INCOMPLETE Status Pill: The student has missing document uploads, pending wet-signatures, or has not yet completed the 5-stage document mandate.',
      'UNAUTHENTICATED Status Pill: The user record exists but phone/email verification or initial credential setup is incomplete.',
      'Filter Controls: Filter student rosters dynamically by assigned Counselor, Status Pill category, visa destination country, or real-time text query.'
    ],
    callout: {
      type: 'tip',
      text: 'Use the counselor assignment dropdown to balance case loads and expedite clearance cycles before embassy deadlines.'
    }
  },
  {
    id: 'document-inspection',
    category: 'Document Inspection & Approval',
    title: 'Document Inspection & Approval Protocol',
    description:
      'Inspect consolidated student PDF bundles, evaluate wet-signature authenticity, and submit structured feedback.',
    tags: ['document inspection', 'approval', 'review', 'pdf', 'feedback', 'reject', 'mandate', 'upgrade form'],
    steps: [
      {
        stepNumber: 1,
        title: 'Open Student Profile Drawer',
        detail: 'Click on any student row in the roster or notification alert to slide open the comprehensive AdminStudentProfileDrawer.'
      },
      {
        stepNumber: 2,
        title: 'Review Merged PDF Package',
        detail: 'Examine the multi-page compiled PDF including the scanned Upgrade Form and all 5 verification attachments in the built-in viewer.'
      },
      {
        stepNumber: 3,
        title: 'Verify Wet Signature & ID Clarity',
        detail: 'Ensure the applicant wet-signed the declaration in ink, names match official government registries, and scans are free of manipulation.'
      },
      {
        stepNumber: 4,
        title: 'Approve or Reject with Notes',
        detail: 'Click [ APPROVE ACCESS ] to transition the student to active maturity tracking, or provide detailed rejection notes explaining required corrections.'
      }
    ],
    callout: {
      type: 'important',
      text: 'Rejection feedback is delivered directly to the student via push notifications and dashboard alert banners for immediate rectification.'
    }
  },
  {
    id: 'top-up-processing',
    category: 'Top-Up Request Processing',
    title: 'Top-Up Request Processing & Ledger Settlement',
    description:
      'Validate top-up liquidity requirements, confirm 2.5% fee receipts, and execute ledger credit actions.',
    tags: ['top-up', 'fee receipt', 'payment reference', 'approve', 'modify', 'deny', 'ledger', 'balance', '2.5%'],
    bulletPoints: [
      'Capital Inspection: Inspect the requested top-up amount against the student visa target deficiency.',
      '2.5% Fee Receipt Verification: Confirm that the student has transferred the 2.5% administrative fee to the official escrow account and verify the bank reference string.',
      'APPROVE Action: Immediately credits the requested capital to the student ledger, resets/extends the 28-day maturity timer, and issues a confirmation receipt.',
      'MODIFY Action: Allows administrators to adjust the approved capital sum if partial liquidity was provided or exchange rate recalculations apply.',
      'DENY Action: Rejects invalid or unverified top-up requests with an audit reason logged in the system ledger.'
    ],
    callout: {
      type: 'warning',
      text: 'Never execute an APPROVE action without confirming the 2.5% fee receipt transaction in your banking portal.'
    }
  },
  {
    id: 'cascading-deletion',
    category: 'User Management & Cascading Deletion',
    title: 'User Management & Cascading Deletion Protocol',
    description:
      'Safely terminate student accounts and purge orphaned dependencies across authentication, database, and storage subsystems.',
    tags: ['user management', 'cascading deletion', 'delete user', 'purge', 'storage', 'firestore', 'auth', 'clean up'],
    bulletPoints: [
      'Multi-Tier Cleanup: Deleting a student initiates a synchronized cascade removing the Firebase Auth user record, Firestore documents (`users`, `pof_evaluations`, `notifications`, `audit_logs`), and Google Cloud Storage buckets.',
      'Audit Logging: Prior to deletion, the system captures an immutable snapshot of the administrative action in system governance records.',
      'Confirmation Safeguard: Cascading deletion requires dual confirmation and administrative credential verification to prevent accidental data loss.'
    ],
    callout: {
      type: 'warning',
      text: 'Cascading deletion is irreversible. All uploaded mandate documents and bank sync ledgers will be permanently destroyed.'
    }
  },
  {
    id: 'admin-glossary',
    category: 'Admin Action Glossary',
    title: 'Admin Action Glossary',
    description:
      'Quick reference for governance buttons and controls in the Staff & Admin Console.',
    tags: ['admin buttons', 'glossary', 'approve access', 'flag low funds', 'export roster', 'override balance'],
    glossaryItems: [
      {
        buttonText: '[ APPROVE ACCESS ]',
        actionDescription: 'Approves a student account, transitioning status to CLEARED and activating PoF maturity tracking.',
        locationTip: 'Located in the footer of AdminStudentProfileDrawer.'
      },
      {
        buttonText: '[ FLAG LOW FUNDS ]',
        actionDescription: 'Flags a student account whose balance has dipped below threshold, notifying the student and assigned counselor.',
        locationTip: 'Found in the AdminStudentProfileDrawer action bar.'
      },
      {
        buttonText: '[ MANUAL OVERRIDE ]',
        actionDescription: 'Allows staff administrators to manually rectify a bank balance discrepancy or adjust FX rates under emergency mandate.',
        locationTip: 'Accessible from the student inspection drawer and settings console.'
      },
      {
        buttonText: '[ BROADCAST ALERT ]',
        actionDescription: 'Sends an urgent system-wide or targeted notification banner to selected students or counselors.',
        locationTip: 'Found in the Admin Support Desk and Notifications Popover.'
      }
    ]
  }
];
