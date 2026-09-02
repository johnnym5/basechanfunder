package com.basechanfunder.app.data.repository

import com.basechanfunder.app.data.local.dao.BalanceDao
import com.basechanfunder.app.data.local.entity.BalanceEntity
import com.basechanfunder.app.data.remote.ApiService
import com.basechanfunder.app.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.flow
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncRepositoryImpl @Inject constructor(
    private val api: ApiService,
    private val dao: BalanceDao
) : SyncRepository {

    override fun syncDailyBalances(userId: String): Flow<Resource<BalanceEntity>> = flow {
        // 1. Emit loading state with current cached data (if any)
        emit(Resource.Loading())
        val cachedBalance = dao.getLatestBalance().firstOrNull()
        if (cachedBalance != null) {
            emit(Resource.Success(cachedBalance))
        }

        // 2. Fetch fresh data from network
        try {
            val response = api.getLiveBalance(userId)
            if (response.isSuccessful) {
                response.body()?.let { dto ->
                    val entity = BalanceEntity(
                        snapshotDate = dto.snapshotDate,
                        aggregatedNgnBalance = dto.aggregatedNgnBalance,
                        convertedForeignBalance = dto.convertedForeignBalance,
                        isAboveThreshold = dto.isAboveThreshold,
                        consecutiveCompliantDays = dto.consecutiveCompliantDays
                    )
                    // 3. Upsert into Room DB
                    dao.insertBalance(entity)
                    // 4. Emit success with fresh data
                    emit(Resource.Success(entity))
                } ?: emit(Resource.Error("Empty response body"))
            } else {
                emit(Resource.Error("Backend error: ${response.code()}"))
            }
        } catch (e: IOException) {
            // Network failure - already emitted cache, so just report error
            emit(Resource.Error("Network failure. Serving cached data."))
        } catch (e: HttpException) {
            emit(Resource.Error("Server error: ${e.message()}"))
        }
    }
}
