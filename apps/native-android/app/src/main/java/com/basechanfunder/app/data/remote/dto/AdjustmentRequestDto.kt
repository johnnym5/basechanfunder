package com.basechanfunder.app.data.remote.dto

data class AdjustmentRequestDto(
    val requestId: String,
    val studentId: String,
    val requestedTopupAmountNgn: Double,
    val requestedExtensionDays: Int,
    val reason: String,
    val status: String,
    val gracePeriodExpiresAt: String
)
