package com.basechanfunder.app.data.local.dao

import androidx.room.*
import com.basechanfunder.app.data.local.entity.BalanceEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface BalanceDao {
    @Query("SELECT * FROM daily_balances WHERE snapshotDate = :date LIMIT 1")
    suspend fun getBalanceByDate(date: String): BalanceEntity?

    @Query("SELECT * FROM daily_balances ORDER BY snapshotDate DESC LIMIT 1")
    fun getLatestBalance(): Flow<BalanceEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBalance(balance: BalanceEntity)

    @Query("DELETE FROM daily_balances")
    suspend fun clearBalances()
}
