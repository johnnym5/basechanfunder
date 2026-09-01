package com.basechanfunder.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "daily_balances")
data class BalanceEntity(
    @PrimaryKey val date: String,
    val amount: Double,
    val currency: String,
    val status: String,
    val lastSynced: Long = System.currentTimeMillis()
)
