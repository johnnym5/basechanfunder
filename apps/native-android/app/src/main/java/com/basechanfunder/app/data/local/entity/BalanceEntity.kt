package com.basechanfunder.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "daily_balances")
data class BalanceEntity(
    @PrimaryKey val snapshotDate: String,
    val aggregatedNgnBalance: Double,
    val convertedForeignBalance: Double,
    val isAboveThreshold: Boolean,
    val consecutiveCompliantDays: Int,
    val lastSynced: Long = System.currentTimeMillis()
)
