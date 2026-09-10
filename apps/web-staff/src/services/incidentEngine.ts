/**
 * Smart Incident & Resolution Engine
 * Maps cryptic system errors to human-readable troubleshooting steps.
 */

export interface SystemIncident {
  code: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  symptom: string;
  resolution: string;
  docsUrl?: string;
}

const KNOWN_INCIDENTS: Record<string, SystemIncident> = {
  'invalid_rapt': {
    code: 'AUTH_SESSION_EXPIRED',
    severity: 'CRITICAL',
    symptom: 'Server operations (Approve/Deny) fail with 500 or 403 errors.',
    resolution: 'Your Google Cloud session has expired. Run "gcloud auth application-default login" in your terminal and restart the server.',
    docsUrl: 'https://cloud.google.com/docs/authentication/provide-credentials-adc'
  },
  'invalid_grant': {
    code: 'AUTH_TOKEN_REVOKED',
    severity: 'CRITICAL',
    symptom: 'Firestore or Auth operations fail immediately.',
    resolution: 'Re-authenticate your project. If using a service account, verify the JSON key is still active in Firebase Console.',
  },
  'Failed to load PDF': {
    code: 'TEMPLATE_NOT_FOUND',
    severity: 'WARNING',
    symptom: 'Stage 3 preview is blank or shows an error box.',
    resolution: 'Verify Upgrade_Form.pdf exists in "apps/server/assets/". Check filename spelling (space vs underscore).',
  },
  'Firebase Storage: Object not found': {
    code: 'FILE_MISSING_IN_CLOUD',
    severity: 'INFO',
    symptom: 'Download buttons do nothing or show 404.',
    resolution: 'The requested file was deleted from Firebase Storage. Check the student documents folder in console.',
  },
  'limit is not defined': {
    code: 'CODE_RUNTIME_ERROR',
    severity: 'CRITICAL',
    symptom: 'Dashboard crashes or goes white when opening modal.',
    resolution: 'Missing import in StaffStudentViewMode.tsx. Ensure "limit" is imported from "firebase/firestore".',
  },
  'No document to update': {
    code: 'FIRESTORE_PATH_MISMATCH',
    severity: 'CRITICAL',
    symptom: 'Evaluation setup or timer updates fail with "No document to update" error.',
    resolution: 'The system tried to update a record using a UID that doesn\'t exist in the evaluations collection yet. Use "Manual Change" first to initialize the student.',
  }
};

export class IncidentEngine {
  /**
   * Analyzes an error message and returns a resolution guide.
   */
  public static troubleshoot(errorMessage: string): SystemIncident {
    // 1. Check for known substrings
    for (const pattern in KNOWN_INCIDENTS) {
      if (errorMessage.includes(pattern)) {
        return KNOWN_INCIDENTS[pattern];
      }
    }

    // 2. Return "New Incident" flag if unknown
    return {
      code: 'NEW_UNIDENTIFIED_ISSUE',
      severity: 'WARNING',
      symptom: errorMessage,
      resolution: 'This is a new type of issue. Please paste the full error log into the dev chat to build a resolution strategy.',
    };
  }

  /**
   * Logs a new incident to the audit trail
   */
  public static async logIncident(err: any, context: string) {
    console.error(`[INCIDENT_LOG] Context: ${context} | Error:`, err);
    // Future: Persistence to /system_incidents collection
  }
}
