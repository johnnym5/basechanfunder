package com.basechanfunder.app.data.repository

import com.basechanfunder.app.data.local.entity.BalanceEntity
import com.basechanfunder.app.util.Resource
import kotlinx.coroutines.flow.Flow

interface SyncRepository {
    fun syncDailyBalances(userId: String): Flow<Resource<BalanceEntity>>
}
