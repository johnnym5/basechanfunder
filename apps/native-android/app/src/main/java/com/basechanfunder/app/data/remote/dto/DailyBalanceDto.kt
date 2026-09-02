package com.basechanfunder.app.data.remote.dto

data class DailyBalanceDto(
    val snapshotDate: String,
    val aggregatedNgnBalance: Double,
    val convertedForeignBalance: Double,
    val isAboveThreshold: Boolean,
    val consecutiveCompliantDays: Int
)
