import 'package:flutter/material.dart';

class MobileDocumentsScreen extends StatelessWidget {
  const MobileDocumentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0D14),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D111A),
        elevation: 0,
        title: const Text(
          'Documents & UKVI Certificates',
          style: TextStyle(color: Color(0xFFF3C77C), fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Section Title
          Text(
            'Official Verification Documents',
            style: TextStyle(color: Colors.grey.shade400, fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
          ),
          const SizedBox(height: 12),

          // UKVI Certificate Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF101522),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFF5B651).withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF262118),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.verified_outlined, color: Color(0xFFF5B651), size: 24),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAlignment.start,
                        children: [
                          Text('UKVI Proof of Funds Certificate', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                          Text('Digitally Signed PDF • Appendix Finance', style: TextStyle(color: Colors.grey, fontSize: 11)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF5B651),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    icon: const Icon(Icons.download, size: 16),
                    label: const Text('Download Compliance Certificate (PDF)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Upload Gift Affidavit Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF101522),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: Column(
              crossAxisAlignment: CrossAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.upload_file_outlined, color: Color(0xFFF5B651), size: 20),
                    SizedBox(width: 10),
                    Text('Deed of Gift / Sponsor Affidavit', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Upload notarized Deed of Gift or sponsor affidavit for flagged deposits (₦3,500,000).',
                  style: TextStyle(color: Colors.grey.shade400, fontSize: 11, height: 1.4),
                ),
                const SizedBox(height: 14),
                OutlinedButton.icon(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: BorderSide(color: Colors.white.withOpacity(0.2)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Select File to Upload', style: TextStyle(fontSize: 12)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
