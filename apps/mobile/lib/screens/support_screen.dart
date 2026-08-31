import 'package:flutter/material.dart';

class MobileSupportScreen extends StatelessWidget {
  const MobileSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0D14),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D111A),
        elevation: 0,
        title: const Text(
          'UKVI Compliance Support',
          style: TextStyle(color: Color(0xFFF3C77C), fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Guidance Header
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
                    Icon(Icons.help_outline_rounded, color: Color(0xFFF5B651), size: 22),
                    SizedBox(width: 10),
                    Text('Home Office Appendix Finance FAQ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                  ],
                ),
                const SizedBox(height: 12),
                _buildFaqItem('What is the 28-day rule?', 'Funds must be held continuously for 28 consecutive days ending no more than 31 days before the visa application date.'),
                const SizedBox(height: 10),
                _buildFaqItem('Why is there an FX Buffer?', 'Fluctuations in currency exchange rates can drop your balance below the requirement. Basechanfunder applies a 5%-10% safety buffer.'),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Chat with Compliance Officer Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF182032),
                foregroundColor: const Color(0xFFF5B651),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                  side: BorderSide(color: const Color(0xFFF5B651).withOpacity(0.3)),
                ),
                elevation: 0,
              ),
              icon: const Icon(Icons.chat_outlined, size: 18),
              label: const Text('Contact Compliance Auditor', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFaqItem(String question, String answer) {
    return Column(
      crossAxisAlignment: CrossAlignment.start,
      children: [
        Text(question, style: const TextStyle(color: Color(0xFFF5B651), fontWeight: FontWeight.bold, fontSize: 12)),
        const SizedBox(height: 4),
        Text(answer, style: TextStyle(color: Colors.grey.shade400, fontSize: 11, height: 1.4)),
      ],
    );
  }
}
