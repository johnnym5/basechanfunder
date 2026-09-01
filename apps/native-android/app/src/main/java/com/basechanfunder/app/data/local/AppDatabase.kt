package com.basechanfunder.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.basechanfunder.app.data.local.dao.BalanceDao
import com.basechanfunder.app.data.local.dao.TransactionDao
import com.basechanfunder.app.data.local.entity.BalanceEntity
import com.basechanfunder.app.data.local.entity.TransactionEntity

@Database(
    entities = [BalanceEntity::class, TransactionEntity::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract val balanceDao: BalanceDao
    abstract val transactionDao: TransactionDao
}
