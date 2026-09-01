package com.basechanfunder.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val remoteId: String? = null,
    val type: String,
    val amount: Double,
    val timestamp: Long,
    val description: String,
    val isSynced: Boolean = false
)
