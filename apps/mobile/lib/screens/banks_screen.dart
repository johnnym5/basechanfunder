import 'package:flutter/material.dart';

class MobileBanksScreen extends StatelessWidget {
  const MobileBanksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0D14),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D111A),
        elevation: 0,
        title: const Text(
          'Financial Accounts & Ingestion',
          style: TextStyle(color: Color(0xFFF3C77C), fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Section Title
          Text(
            'Linked Bank Accounts (Open Banking)',
            style: TextStyle(color: Colors.grey.shade400, fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
          ),
          const SizedBox(height: 12),

          // GTBank Card
          _buildBankCard(
            bankName: 'Guaranty Trust Bank (GTBank)',
            accountMask: '******4912',
            balanceNGN: '₦28,500,000.00',
            balanceGBP: '£14,650.00',
            status: 'CONNECTED',
            provider: 'Mono Open Banking',
          ),
          const SizedBox(height: 12),

          // Zenith Bank Card
          _buildBankCard(
            bankName: 'Zenith Bank PLC',
            accountMask: '******8019',
            balanceNGN: '₦6,800,000.00',
            balanceGBP: '£3,495.00',
            status: 'SMS PARSER ACTIVE',
            provider: 'Encrypted SMS Agent',
          ),
          const SizedBox(height: 24),

          // Add New Bank Button
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
              icon: const Icon(Icons.add_circle_outline, size: 18),
              label: const Text(
                'Link Additional Bank Account (OAuth2)',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBankCard({
    required String bankName,
    required String accountMask,
    required String balanceNGN,
    required String balanceGBP,
    required String status,
    required String provider,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF101522),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF182032),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.account_balance, color: Color(0xFFF5B651), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAlignment.start,
                    children: [
                      Text(bankName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                      Text('$accountMask • $provider', style: TextStyle(color: Colors.grey.shade400, fontSize: 11, fontFamily: 'monospace')),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF003822),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF00E676), width: 0.8),
                ),
                child: Text(
                  status,
                  style: const TextStyle(color: Color(0xFF00E676), fontSize: 9, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: Colors.white10, height: 1),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAlignment.start,
                children: [
                  Text('Local Balance (NGN)', style: TextStyle(color: Colors.grey.shade500, fontSize: 10)),
                  Text(balanceNGN, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAlignment.end,
                children: [
                  Text('Converted GBP', style: TextStyle(color: Colors.grey.shade500, fontSize: 10)),
                  Text(balanceGBP, style: const TextStyle(color: Color(0xFFF5B651), fontWeight: FontWeight.bold, fontSize: 14)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
