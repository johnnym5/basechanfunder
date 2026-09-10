import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Permanently deletes a student user and all associated data.
 */
export const deleteUserCompletely = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Auth context missing.");
  }

  const targetUid = request.data.targetUid;
  if (!targetUid) {
    throw new HttpsError("invalid-argument", "Target student UID is required.");
  }

  const db = admin.firestore();
  const storage = admin.storage().bucket();

  try {
    const batch = db.batch();
    const userRef = db.collection("users").doc(targetUid);

    const accountsSnap = await db.collection("financial_accounts")
      .where("userId", "==", targetUid).get();
    accountsSnap.forEach((d) => batch.delete(d.ref));

    const evalsSnap = await db.collection("pof_evaluations")
      .where("userId", "==", targetUid).get();
    evalsSnap.forEach((d) => batch.delete(d.ref));

    const subDocs = await userRef.collection("submitted_documents").get();
    subDocs.forEach((d) => batch.delete(d.ref));

    const logsSnap = await db.collection("audit_logs")
      .where("studentId", "==", targetUid).get();
    logsSnap.forEach((d) => batch.delete(d.ref));

    const notifsSnap = await db.collection("notifications")
      .where("userId", "==", targetUid).get();
    notifsSnap.forEach((d) => batch.delete(d.ref));

    batch.delete(userRef);
    await batch.commit();

    const prefixes = [
      `student_documents/${targetUid}/`,
      `student_packages/${targetUid}/`,
      `mandate_packages/${targetUid}/`,
    ];

    for (const prefix of prefixes) {
      await storage.deleteFiles({prefix, force: true}).catch((err) => {
        console.warn(`Storage delete failed for ${prefix}:`, err.message);
      });
    }

    await admin.auth().deleteUser(targetUid);

    return {
      success: true,
      message: `Cascading purge completed for ${targetUid}.`,
    };
  } catch (error) {
    const msg = (error as Error).message;
    console.error("Critical Purge Failure:", error);
    throw new HttpsError("internal", msg || "Purge failed.");
  }
});
