import 'package:flutter/material.dart';

class StitchMobileDashboard extends StatefulWidget {
  const StitchMobileDashboard({super.key});

  @override
  State<StitchMobileDashboard> createState() => _StitchMobileDashboardState();
}

class _StitchMobileDashboardState extends State<StitchMobileDashboard> {
  int _selectedNavIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0D14),
      body: SafeArea(
        child: Column(
          children: [
            // Top App Bar Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: Row(
                children: [
                  // User Avatar
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFE5A635), width: 1.5),
                      image: const DecorationImage(
                        image: NetworkImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // User Greetings & App Name
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAlignment.start,
                      children: [
                        Text(
                          'Hello, Chidi',
                          style: TextStyle(color: Colors.grey.shade400, fontSize: 11, fontFamily: 'monospace'),
                        ),
                        const Text(
                          'Basechanfunder',
                          style: TextStyle(
                            color: Color(0xFFF3C77C),
                            fontSize: 18,
                            fontWeight: FontWeight.black,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Visa Target & Status Badge
                  Column(
                    crossAxisAlignment: CrossAlignment.end,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.public, color: Colors.grey.shade400, size: 12),
                          const SizedBox(width: 4),
                          const Text(
                            'Target: UK Student Visa 🇬🇧',
                            style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF003822),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF00E676), width: 0.8),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.check_circle_outline, color: Color(0xFF00E676), size: 10),
                            SizedBox(width: 4),
                            Text(
                              'COMPLIANT_HOLDING',
                              style: TextStyle(
                                color: Color(0xFF00E676),
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Scrollable Content Body
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Column(
                  children: [
                    // 1. Proof of Funds Target Radial Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20.0),
                      decoration: BoxDecoration(
                        color: const Color(0xFF101522),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withOpacity(0.08)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.4),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          const Text(
                            'PROOF OF FUNDS TARGET',
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 2.0,
                              fontFamily: 'monospace',
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Radial Gauge Ring
                          Stack(
                            alignment: Alignment.center,
                            children: [
                              SizedBox(
                                width: 170,
                                height: 170,
                                child: CircularProgressIndicator(
                                  value: 0.82,
                                  strokeWidth: 12,
                                  backgroundColor: const Color(0xFF1E2638),
                                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFF5B651)),
                                  strokeCap: strokeCapRound,
                                ),
                              ),
                              Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text(
                                    '£13,761',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 30,
                                      fontWeight: FontWeight.black,
                                      letterSpacing: -0.5,
                                    ),
                                  ),
                                  Text(
                                    'GBP Equiv.',
                                    style: TextStyle(
                                      color: const Color(0xFFF5B651),
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // Current vs Required NGN Row
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              Column(
                                children: [
                                  Text('Current', style: TextStyle(color: Colors.grey.shade400, fontSize: 11, fontFamily: 'monospace')),
                                  const SizedBox(height: 4),
                                  const Text('₦18,450,000', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                                ],
                              ),
                              Container(width: 1, height: 28, color: Colors.white10),
                              Column(
                                children: [
                                  Text('Required', style: TextStyle(color: Colors.grey.shade400, fontSize: 11, fontFamily: 'monospace')),
                                  const SizedBox(height: 4),
                                  const Text('₦19,200,000', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // FX Volatility Warning Box
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF171D2D),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.white.withOpacity(0.06)),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.trending_up, color: Color(0xFFF5B651), size: 14),
                                SizedBox(width: 8),
                                Text(
                                  'FX Volatility Warning: +5% Buffer Applied',
                                  style: TextStyle(
                                    color: Color(0xFFF5B651),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // 2. 28-Day Maturity Rules Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18.0),
                      decoration: BoxDecoration(
                        color: const Color(0xFF101522),
                        borderRadius: BorderRadius.circular(20),
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
                                  Icon(Icons.calendar_month_outlined, color: Colors.grey.shade400, size: 16),
                                  const SizedBox(width: 8),
                                  const Text(
                                    '28-Day Maturity Rules',
                                    style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF262118),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFF5B651).withOpacity(0.3)),
                                ),
                                child: const Text(
                                  'Readiness: Sept 24, 2026',
                                  style: TextStyle(color: Color(0xFFF5B651), fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          const Text(
                            'Day 19 of 28 Days Uninterrupted',
                            style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 14),
                          // Custom Segmented Progress Bar
                          Row(
                            children: [
                              Expanded(
                                flex: 19,
                                child: Container(
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF5B651),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                flex: 9,
                                child: Container(
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1E2638),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // 3. Financial Ingestion Sources List
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Financial Ingestion Sources',
                        style: TextStyle(color: Colors.grey.shade400, fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                      ),
                    ),
                    const SizedBox(height: 10),

                    _buildIngestionTile(
                      icon: Icons.account_balance,
                      title: 'GTBank',
                      subtitle: 'API Sync',
                      isOnline: true,
                    ),
                    const SizedBox(height: 10),
                    _buildIngestionTile(
                      icon: Icons.chat_bubble_outline,
                      title: 'Zenith Parser',
                      subtitle: 'SMS Agent',
                      isOnline: true,
                    ),
                    const SizedBox(height: 10),
                    _buildIngestionTile(
                      icon: Icons.receipt_long_outlined,
                      title: 'MBS Ticket',
                      subtitle: 'Statement',
                      isVerified: true,
                    ),
                    const SizedBox(height: 16),

                    // 4. Source of Funds Flag Alert Box
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18.0),
                      decoration: BoxDecoration(
                        color: const Color(0xFF101522),
                        borderRadius: BorderRadius.circular(20),
                        border: Border(
                          left: const BorderSide(color: Color(0xFFF5B651), width: 4),
                          top: BorderSide(color: Colors.white.withOpacity(0.08)),
                          right: BorderSide(color: Colors.white.withOpacity(0.08)),
                          bottom: BorderSide(color: Colors.white.withOpacity(0.08)),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.warning_amber_rounded, color: Color(0xFFF5B651), size: 18),
                              SizedBox(width: 8),
                              Text(
                                'Source of Funds Flag',
                                style: TextStyle(color: Color(0xFFF5B651), fontSize: 14, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            'Unexplained Deposit Flagged (₦3,500,000). To maintain uninterrupted maturity status, source verification is required.',
                            style: TextStyle(color: Colors.grey.shade300, fontSize: 11, height: 1.5),
                          ),
                          const SizedBox(height: 14),
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
                              icon: const Icon(Icons.upload_file_outlined, size: 16),
                              label: const Text(
                                'Upload Deed / Gift Affidavit',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Bottom Navigation Bar
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF0D111A),
                border: Border(top: BorderSide(color: Colors.white.withOpacity(0.08))),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildNavItem(0, Icons.account_balance_wallet_outlined, 'Status'),
                  _buildNavItem(1, Icons.account_tree_outlined, 'Banks'),
                  _buildNavItem(2, Icons.folder_outlined, 'Documents'),
                  _buildNavItem(3, Icons.support_agent_outlined, 'Support'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIngestionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    bool isOnline = false,
    bool isVerified = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF101522),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF182032),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: const Color(0xFFF5B651), size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                Text(subtitle, style: TextStyle(color: Colors.grey.shade400, fontSize: 10, fontFamily: 'monospace')),
              ],
            ),
          ),
          if (isOnline)
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: Color(0xFF00E676),
                shape: BoxShape.circle,
              ),
            ),
          if (isVerified)
            const Icon(Icons.check_circle, color: Color(0xFF00E676), size: 16),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _selectedNavIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedNavIndex = index),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: isSelected ? const Color(0xFFF5B651) : Colors.grey.shade600,
            size: 20,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: isSelected ? const Color(0xFFF5B651) : Colors.grey.shade600,
              fontSize: 10,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              fontFamily: 'monospace',
            ),
          ),
        ],
      ),
    );
  }
}
