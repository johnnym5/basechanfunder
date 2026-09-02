import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import 'banks_screen.dart';
import 'documents_screen.dart';
import 'support_screen.dart';
import 'adjustment_request_screen.dart';
import 'waiting_for_approval_screen.dart';

class StitchMobileDashboard extends StatefulWidget {
  const StitchMobileDashboard({super.key});

  @override
  State<StitchMobileDashboard> createState() => _StitchMobileDashboardState();
}

class _StitchMobileDashboardState extends State<StitchMobileDashboard> {
  int _selectedNavIndex = 0;

  final List<Widget> _screens = [
    const _StatusContentScreen(),
    const MobileBanksScreen(),
    const MobileDocumentsScreen(),
    const MobileSupportScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);

    // Approval Logic Ported from Web App
    if (authService.appUser != null && !authService.appUser!.isApproved) {
      return const WaitingForApprovalScreen();
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0A0D14),
      body: SafeArea(
        child: IndexedStack(
          index: _selectedNavIndex,
          children: _screens,
        ),
      ),
      bottomNavigationBar: Container(
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

class _StatusContentScreen extends StatelessWidget {
  const _StatusContentScreen();

  @override
  Widget build(BuildContext context) {
    return Column(
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
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAlignment.start,
                  children: [
                    Text('Hello, Chidi', style: TextStyle(color: Colors.grey.shade400, fontSize: 11, fontFamily: 'monospace')),
                    const Text(
                      'Basechanfunder',
                      style: TextStyle(color: Color(0xFFF3C77C), fontSize: 18, fontWeight: FontWeight.black),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAlignment.end,
                children: [
                  Row(
                    children: [
                      Icon(Icons.public, color: Colors.grey.shade400, size: 12),
                      const SizedBox(width: 4),
                      const Text('Target: UK Student Visa 🇬🇧', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
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
                        Text('COMPLIANT_HOLDING', style: TextStyle(color: Color(0xFF00E676), fontSize: 9, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // Scrollable Body
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Column(
              children: [
                // 0. Adjustment Hub Shortcut Banner
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14.0),
                  decoration: BoxDecoration(
                    color: const Color(0xFF131A2B),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFF5B651).withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF262118),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.tune, color: Color(0xFFF5B651), size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAlignment.start,
                          children: [
                            Text(
                              'Funding & Timeline Adjustment Hub',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'Request target changes with 24h grace period',
                              style: TextStyle(
                                color: Color(0xFFF5B651),
                                fontSize: 10,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const AdjustmentRequestScreen(),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF5B651),
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                        child: const Text('Open Hub', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 1. Proof of Funds Target Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20.0),
                  decoration: BoxDecoration(
                    color: const Color(0xFF101522),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withOpacity(0.08)),
                  ),
                  child: Column(
                    children: [
                      const Text('PROOF OF FUNDS TARGET', style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 2.0, fontFamily: 'monospace')),
                      const SizedBox(height: 20),
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
                              strokeCap: StrokeCap.round,
                            ),
                          ),
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text('£13,761', style: TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.black)),
                              Text('GBP Equiv.', style: TextStyle(color: const Color(0xFFF5B651), fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
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
                            Text('FX Volatility Warning: +5% Buffer Applied', style: TextStyle(color: Color(0xFFF5B651), fontSize: 10, fontWeight: FontWeight.w600, fontFamily: 'monospace')),
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
                              const Text('28-Day Maturity Rules', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF262118),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFF5B651).withOpacity(0.3)),
                            ),
                            child: const Text('Readiness: Sept 24, 2026', style: TextStyle(color: Color(0xFFF5B651), fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      const Text('Day 19 of 28 Days Uninterrupted', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            flex: 19,
                            child: Container(
                              height: 8,
                              decoration: BoxDecoration(color: const Color(0xFFF5B651), borderRadius: BorderRadius.circular(4)),
                            ),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            flex: 9,
                            child: Container(
                              height: 8,
                              decoration: BoxDecoration(color: const Color(0xFF1E2638), borderRadius: BorderRadius.circular(4)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
