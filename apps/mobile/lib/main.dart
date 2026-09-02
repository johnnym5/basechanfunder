import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'screens/dashboard_screen.dart';
import 'services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthService(),
      child: const BasechanfunderMobileApp(),
    ),
  );
}

class BasechanfunderMobileApp extends StatelessWidget {
  const BasechanfunderMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Basechanfunder',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0A0D14),
        primaryColor: const Color(0xFFF5B651),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFF5B651),
          brightness: Brightness.dark,
        ),
      ),
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);

    if (authService.isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFFF5B651)),
        ),
      );
    }

    if (authService.firebaseUser == null) {
      // For now, if no user, we might want a login screen.
      // Since this is a porting task, I'll assume we want the dashboard or a login prompt.
      return const LoginPlaceholder();
    }

    return const StitchMobileDashboard();
  }
}

class LoginPlaceholder extends StatelessWidget {
  const LoginPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.shield_outlined, size: 80, color: Color(0xFFF5B651)),
            const SizedBox(height: 24),
            const Text('Welcome to Basechanfunder', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                // Mock login for demonstration if needed, or link to real Firebase UI
              },
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF5B651)),
              child: const Text('Sign In to Continue', style: TextStyle(color: Colors.black)),
            ),
          ],
        ),
      ),
    );
  }
}
