import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

enum UserRole {
  STUDENT,
  STAFF_AUDITOR,
  COUNSELOR,
  ADMIN_GOVERNANCE,
}

class AppUser {
  final String uid;
  final String email;
  final String displayName;
  final String photoURL;
  final UserRole role;
  final bool isApproved;

  AppUser({
    required this.uid,
    required this.email,
    required this.displayName,
    required this.photoURL,
    required this.role,
    required this.isApproved,
  });

  factory AppUser.fromFirestore(Map<String, dynamic> data, String uid) {
    return AppUser(
      uid: uid,
      email: data['email'] ?? '',
      displayName: data['displayName'] ?? '',
      photoURL: data['photoURL'] ?? '',
      role: _parseRole(data['role']),
      isApproved: data['isApproved'] ?? false,
    );
  }

  static UserRole _parseRole(String? roleStr) {
    switch (roleStr) {
      case 'ADMIN_GOVERNANCE':
        return UserRole.ADMIN_GOVERNANCE;
      case 'STAFF_AUDITOR':
        return UserRole.STAFF_AUDITOR;
      case 'COUNSELOR':
        return UserRole.COUNSELOR;
      case 'STUDENT':
      default:
        return UserRole.STUDENT;
    }
  }
}

class AuthService extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  User? _firebaseUser;
  AppUser? _appUser;
  bool _isLoading = true;

  User? get firebaseUser => _firebaseUser;
  AppUser? get appUser => _appUser;
  bool get isLoading => _isLoading;

  AuthService() {
    _auth.authStateChanges().listen(_onAuthStateChanged);
  }

  Future<void> _onAuthStateChanged(User? user) async {
    _firebaseUser = user;
    if (user == null) {
      _appUser = null;
      _isLoading = false;
      notifyListeners();
      return;
    }

    try {
      final role = deriveRole(user.email ?? '');
      // Ported logic: Admins/Counselors auto-approved, Students need manual approval
      final isApproved = role != UserRole.STUDENT;

      final userDoc = await _db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        _appUser = AppUser.fromFirestore(userDoc.data()!, user.uid);
      } else {
        // Create initial profile if it doesn't exist
        final newUser = {
          'uid': user.uid,
          'email': user.email ?? '',
          'displayName': user.displayName ?? user.email?.split('@')[0] ?? 'User',
          'photoURL': user.photoURL ?? '',
          'role': role.toString().split('.').last,
          'isApproved': isApproved,
          'createdAt': FieldValue.serverTimestamp(),
        };
        await _db.collection('users').doc(user.uid).set(newUser);
        _appUser = AppUser.fromFirestore(newUser, user.uid);
      }
    } catch (e) {
      debugPrint('Error fetching user profile: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  UserRole deriveRole(String email) {
    final lower = email.toLowerCase();
    if (lower.endsWith('@basechaninternational.com')) return UserRole.ADMIN_GOVERNANCE;
    if (lower.contains('auditor')) return UserRole.STAFF_AUDITOR;
    if (lower.endsWith('.basechaninternational@gmail.com') || lower.contains('counselor')) return UserRole.COUNSELOR;
    return UserRole.STUDENT;
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }
}
