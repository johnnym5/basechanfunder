import 'package:flutter/material.dart';

enum AdjustmentType {
  fundingTarget,
  timelineExtension,
  fxBufferOverride,
  documentAmendment,
}

enum AdjustmentStatus {
  pending,
  underReview,
  approved,
  rejected,
  cancelled,
}

class AdjustmentItem {
  final String id;
  final AdjustmentType type;
  final String typeLabel;
  final String currentValue;
  final String requestedValue;
  final String reason;
  final DateTime createdAt;
  final DateTime gracePeriodExpiresAt;
  AdjustmentStatus status;
  final String? counselorNotes;

  AdjustmentItem({
    required this.id,
    required this.type,
    required this.typeLabel,
    required this.currentValue,
    required this.requestedValue,
    required this.reason,
    required this.createdAt,
    required this.gracePeriodExpiresAt,
    required this.status,
    this.counselorNotes,
  });

  bool get isGracePeriodActive {
    return DateTime.now().isBefore(gracePeriodExpiresAt) &&
        status == AdjustmentStatus.pending;
  }

  Duration get remainingGracePeriod {
    final diff = gracePeriodExpiresAt.difference(DateTime.now());
    return diff.isNegative ? Duration.zero : diff;
  }
}

class AdjustmentRequestScreen extends StatefulWidget {
  const AdjustmentRequestScreen({super.key});

  @override
  State<AdjustmentRequestScreen> createState() =>
      _AdjustmentRequestScreenState();
}

class _AdjustmentRequestScreenState extends State<AdjustmentRequestScreen> {
  final List<AdjustmentItem> _requests = [
    AdjustmentItem(
      id: 'ADJ-2026-001',
      type: AdjustmentType.fundingTarget,
      typeLabel: 'Funding Target Adjustment',
      currentValue: '£13,340.00',
      requestedValue: '£14,850.00',
      reason: 'Living costs increase for inner London accommodation deposit.',
      createdAt: DateTime.now().subtract(const Duration(hours: 4)),
      gracePeriodExpiresAt:
          DateTime.now().add(const Duration(hours: 20)),
      status: AdjustmentStatus.pending,
      counselorNotes: null,
    ),
    AdjustmentItem(
      id: 'ADJ-2026-002',
      type: AdjustmentType.timelineExtension,
      typeLabel: '28-Day Timeline Extension',
      currentValue: 'Sept 24, 2026',
      requestedValue: 'Oct 08, 2026 (+14 Days)',
      reason: 'Delaying CAS issuance date with admissions office.',
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
      gracePeriodExpiresAt:
          DateTime.now().subtract(const Duration(days: 1)),
      status: AdjustmentStatus.approved,
      counselorNotes:
          'Approved by Counselor Sarah Morgan. Target readiness date updated.',
    ),
  ];

  void _showCreateAdjustmentModal() {
    AdjustmentType selectedType = AdjustmentType.fundingTarget;
    final currentValueController =
        TextEditingController(text: '£13,340.00');
    final requestedValueController = TextEditingController();
    final reasonController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF101522),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalContext, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Request Hub Adjustment',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.grey),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF182032),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: const Color(0xFFF5B651).withOpacity(0.3)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.timer_outlined,
                              color: Color(0xFFF5B651), size: 16),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              '24-Hour Grace Period: Editable and retractable for 24h after submission.',
                              style: TextStyle(
                                  color: Color(0xFFF5B651),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text('Adjustment Category',
                        style: TextStyle(color: Colors.grey, fontSize: 11)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0A0D14),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.white12),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<AdjustmentType>(
                          value: selectedType,
                          dropdownColor: const Color(0xFF101522),
                          isExpanded: true,
                          style: const TextStyle(
                              color: Colors.white, fontSize: 13),
                          items: const [
                            DropdownMenuItem(
                              value: AdjustmentType.fundingTarget,
                              child: Text('Funding Target Adjustment (£)'),
                            ),
                            DropdownMenuItem(
                              value: AdjustmentType.timelineExtension,
                              child: Text('28-Day Timeline Extension'),
                            ),
                            DropdownMenuItem(
                              value: AdjustmentType.fxBufferOverride,
                              child: Text('FX Volatility Buffer Override (%)'),
                            ),
                            DropdownMenuItem(
                              value: AdjustmentType.documentAmendment,
                              child: Text('Source of Funds Document Amendment'),
                            ),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              setModalState(() => selectedType = val);
                            }
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text('Requested Target Value',
                        style: TextStyle(color: Colors.grey, fontSize: 11)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: requestedValueController,
                      style:
                          const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'e.g. £14,850.00 or +14 Days',
                        hintStyle: TextStyle(
                            color: Colors.grey.shade600, fontSize: 12),
                        filled: true,
                        fillColor: const Color(0xFF0A0D14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: Colors.white12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text('Reason & Justification',
                        style: TextStyle(color: Colors.grey, fontSize: 11)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: reasonController,
                      maxLines: 3,
                      style:
                          const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: InputDecoration(
                        hintText:
                            'Explain justification for this adjustment (reviewed by assigned counselor)...',
                        hintStyle: TextStyle(
                            color: Colors.grey.shade600, fontSize: 12),
                        filled: true,
                        fillColor: const Color(0xFF0A0D14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: Colors.white12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF5B651),
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          if (requestedValueController.text.trim().isEmpty ||
                              reasonController.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content: Text(
                                      'Please complete requested value and reason')),
                            );
                            return;
                          }

                          final newItem = AdjustmentItem(
                            id: 'ADJ-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
                            type: selectedType,
                            typeLabel: selectedType ==
                                    AdjustmentType.fundingTarget
                                ? 'Funding Target Adjustment'
                                : selectedType ==
                                        AdjustmentType.timelineExtension
                                    ? '28-Day Timeline Extension'
                                    : selectedType ==
                                            AdjustmentType.fxBufferOverride
                                        ? 'FX Buffer Override'
                                        : 'Document Amendment',
                            currentValue: currentValueController.text,
                            requestedValue:
                                requestedValueController.text.trim(),
                            reason: reasonController.text.trim(),
                            createdAt: DateTime.now(),
                            gracePeriodExpiresAt: DateTime.now()
                                .add(const Duration(hours: 24)),
                            status: AdjustmentStatus.pending,
                          );

                          setState(() {
                            _requests.insert(0, newItem);
                          });

                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              backgroundColor: Color(0xFF003822),
                              content: Text(
                                  'Adjustment submitted. 24-hour grace period activated.',
                                  style: TextStyle(color: Color(0xFF00E676))),
                            ),
                          );
                        },
                        child: const Text('Submit Adjustment (24h Grace Period)',
                            style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _cancelRequest(AdjustmentItem item) {
    if (!item.isGracePeriodActive) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.redAccent,
          content: Text(
              '24-Hour grace period has expired. Request is locked under review.'),
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF101522),
        title: const Text('Retract Adjustment Request?',
            style: TextStyle(color: Colors.white, fontSize: 16)),
        content: Text(
          'You are retracting ${item.id} within your 24-hour grace period. This will cancel the pending review.',
          style: const TextStyle(color: Colors.grey, fontSize: 12),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Keep Active',
                style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () {
              setState(() {
                item.status = AdjustmentStatus.cancelled;
              });
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content: Text('Adjustment request retracted successfully.')),
              );
            },
            child: const Text('Confirm Retraction',
                style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0D14),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D111A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new,
              color: Color(0xFFF3C77C), size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Funding & Timeline Adjustment Hub',
          style: TextStyle(
              color: Color(0xFFF3C77C),
              fontWeight: FontWeight.bold,
              fontSize: 15),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Assigned Counselor Card (RBAC Scoping)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF101522),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF182032),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.admin_panel_settings_outlined,
                      color: Color(0xFFF5B651), size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAlignment.start,
                    children: [
                      const Text('Assigned Compliance Counselor',
                          style: TextStyle(
                              color: Colors.grey,
                              fontSize: 10,
                              fontFamily: 'monospace')),
                      const SizedBox(height: 2),
                      const Text('Dr. Sarah Morgan',
                          style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14)),
                      Text('RBAC Scoped · ID: counselor-sarah-101',
                          style: TextStyle(
                              color: Colors.grey.shade400,
                              fontSize: 10,
                              fontFamily: 'monospace')),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF003822),
                    borderRadius: BorderRadius.circular(8),
                    border:
                        Border.all(color: const Color(0xFF00E676), width: 0.8),
                  ),
                  child: const Text(
                    'ASSIGNED',
                    style: TextStyle(
                        color: Color(0xFF00E676),
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'monospace'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Request Hub Action Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _showCreateAdjustmentModal,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF5B651),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              icon: const Icon(Icons.tune, size: 18),
              label: const Text(
                'Request Funding / Timeline Adjustment',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Section Title
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Adjustment History & Grace Periods',
                style: TextStyle(
                    color: Colors.grey.shade400,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace'),
              ),
              Text(
                '${_requests.length} Requests',
                style: const TextStyle(
                    color: Color(0xFFF5B651),
                    fontSize: 11,
                    fontFamily: 'monospace'),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Adjustment Request Cards
          ..._requests.map((req) => _buildAdjustmentCard(req)),
        ],
      ),
    );
  }

  Widget _buildAdjustmentCard(AdjustmentItem req) {
    final isGrace = req.isGracePeriodActive;
    final hours = req.remainingGracePeriod.inHours;
    final minutes = req.remainingGracePeriod.inMinutes.remainder(60);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF101522),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isGrace
              ? const Color(0xFFF5B651).withOpacity(0.4)
              : Colors.white.withOpacity(0.08),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                req.typeLabel,
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13),
              ),
              _buildStatusBadge(req.status),
            ],
          ),
          const SizedBox(height: 4),
          Text('${req.id} • Target Value: ${req.requestedValue}',
              style: const TextStyle(
                  color: Color(0xFFF5B651),
                  fontSize: 11,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(
            req.reason,
            style: TextStyle(color: Colors.grey.shade400, fontSize: 11, height: 1.4),
          ),
          const SizedBox(height: 12),

          // 24-Hour Grace Period Indicator
          if (req.status == AdjustmentStatus.pending) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isGrace
                    ? const Color(0xFF262118)
                    : const Color(0xFF181B25),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isGrace
                      ? const Color(0xFFF5B651).withOpacity(0.3)
                      : Colors.white10,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    isGrace ? Icons.schedule : Icons.lock_clock,
                    color: isGrace ? const Color(0xFFF5B651) : Colors.grey,
                    size: 14,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      isGrace
                          ? '24h Grace Period Active: ${hours}h ${minutes}m left to edit/cancel'
                          : 'Grace Period Expired: Locked for counselor audit',
                      style: TextStyle(
                        color: isGrace
                            ? const Color(0xFFF5B651)
                            : Colors.grey.shade400,
                        fontSize: 10,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  if (isGrace)
                    GestureDetector(
                      onTap: () => _cancelRequest(req),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.redAccent.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                              color: Colors.redAccent.withOpacity(0.5)),
                        ),
                        child: const Text('Retract',
                            style: TextStyle(
                                color: Colors.redAccent,
                                fontSize: 9,
                                fontWeight: FontWeight.bold)),
                      ),
                    ),
                ],
              ),
            ),
          ],

          if (req.counselorNotes != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF003822).withOpacity(0.3),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle,
                      color: Color(0xFF00E676), size: 12),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      req.counselorNotes!,
                      style: const TextStyle(
                          color: Color(0xFF00E676), fontSize: 10),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusBadge(AdjustmentStatus status) {
    Color bg;
    Color border;
    Color text;
    String label;

    switch (status) {
      case AdjustmentStatus.approved:
        bg = const Color(0xFF003822);
        border = const Color(0xFF00E676);
        text = const Color(0xFF00E676);
        label = 'APPROVED';
        break;
      case AdjustmentStatus.pending:
        bg = const Color(0xFF262118);
        border = const Color(0xFFF5B651);
        text = const Color(0xFFF5B651);
        label = 'PENDING (24h)';
        break;
      case AdjustmentStatus.underReview:
        bg = const Color(0xFF182032);
        border = Colors.cyan;
        text = Colors.cyan;
        label = 'UNDER REVIEW';
        break;
      case AdjustmentStatus.rejected:
        bg = Colors.red.shade900.withOpacity(0.3);
        border = Colors.redAccent;
        text = Colors.redAccent;
        label = 'REJECTED';
        break;
      case AdjustmentStatus.cancelled:
        bg = Colors.grey.shade900;
        border = Colors.grey;
        text = Colors.grey;
        label = 'RETRACTED';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border, width: 0.8),
      ),
      child: Text(
        label,
        style: TextStyle(
            color: text,
            fontSize: 9,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace'),
      ),
    );
  }
}
