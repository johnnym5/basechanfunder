import 'package:flutter/material.dart';
import 'screens/dashboard_screen.dart';

void main() {
  runApp(const BasechanfunderMobileApp());
}

class BasechanfunderMobileApp extends StatelessWidget {
  const BasechanfunderMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Basechanfunder',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0B0F19),
        primaryColor: Colors.blueAccent,
      ),
      home: const MobileDashboardScreen(),
    );
  }
}
