import 'package:flutter/material.dart';

class MobileDashboardScreen extends StatelessWidget {
  const MobileDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        title: const Row(
          children: [
            Icon(Icons.verified_user, color: Colors.blueAccent),
            SizedBox(width: 8),
            Text(
              'Basechanfunder',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_active_outlined),
            onPressed: () {},
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAlignment.start,
          children: [
            // Status Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.blueAccent.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'UKVI 28-Day Countdown',
                        style: TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.green.withOpacity(0.3)),
                        ),
                        child: const Text(
                          'Day 24 / 28',
                          style: TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    '£14,850.00',
                    style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Lowest Balance Recorded in Window',
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  const SizedBox(height: 16),
                  LinearProgressIndicator(
                    value: 24 / 28,
                    backgroundColor: Colors.white10,
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.blueAccent),
                    minHeight: 6,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'Linked Accounts',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            // Account Tile
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white10),
              ),
              child: const Row(
                children: [
                  CircleAvatar(
                    backgroundColor: Colors.blueAccent,
                    child: Icon(Icons.account_balance, color: Colors.white),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAlignment.start,
                      children: [
                        Text('GTBank Nigeria', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        Text('******4912 • Open Banking', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                  ),
                  Text('₦28,500,000', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
