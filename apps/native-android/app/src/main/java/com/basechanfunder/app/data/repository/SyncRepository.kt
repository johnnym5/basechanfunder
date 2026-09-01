package com.basechanfunder.app.data.repository

import com.basechanfunder.app.data.remote.dto.DailyBalanceDto
import com.basechanfunder.app.util.Resource
import kotlinx.coroutines.flow.Flow

interface SyncRepository {
    fun getDailyBalances(
        startDate: String?,
        endDate: String?,
        fetchFromRemote: Boolean
    ): Flow<Resource<List<DailyBalanceDto>>>
}
