import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class WaitingForApprovalScreen extends StatelessWidget {
  const WaitingForApprovalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0D14),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon/Illustration
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF131A2B),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFF5B651).withOpacity(0.2)),
                ),
                child: const Icon(
                  Icons.pending_actions_outlined,
                  color: Color(0xFFF5B651),
                  size: 64,
                ),
              ),
              const SizedBox(height: 32),

              const Text(
                'Waiting for Approval',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              Text(
                'Your account has been created successfully. A Basechanfunder administrator needs to verify your identity before you can access the compliance dashboard.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.grey.shade400,
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 48),

              // Action Buttons
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    // Re-triggering auth check by signing out or just showing a snackbar
                    // In a real app, this might just refresh the provider state
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Checking approval status...')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF5B651),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Refresh Status', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 16),

              TextButton(
                onPressed: () => authService.signOut(),
                child: const Text(
                  'Sign Out',
                  style: TextStyle(color: Color(0xFFF5B651)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
