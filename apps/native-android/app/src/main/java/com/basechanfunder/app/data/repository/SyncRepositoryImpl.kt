package com.basechanfunder.app.data.repository

import com.basechanfunder.app.data.local.dao.BalanceDao
import com.basechanfunder.app.data.local.entity.BalanceEntity
import com.basechanfunder.app.data.remote.ApiService
import com.basechanfunder.app.data.remote.dto.DailyBalanceDto
import com.basechanfunder.app.util.Resource
import kotlinx.coroutines.flow.Flow
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

    override fun getDailyBalances(
        startDate: String?,
        endDate: String?,
        fetchFromRemote: Boolean
    ): Flow<Resource<List<DailyBalanceDto>>> = flow {
        emit(Resource.Loading())

        // 1. Emit local data immediately
        val localBalances = dao.getAllBalances()
        // Note: In a real app, we'd collect from the DAO Flow or use a non-Flow query for the initial state
        // For simplicity in this sync logic:
        // emit(Resource.Loading(dao.getAllBalancesOnce().map { it.toDto() })) 

        // 2. Fetch from remote if requested
        if (fetchFromRemote) {
            try {
                val response = api.getDailyBalances(startDate, endDate)
                if (response.isSuccessful) {
                    response.body()?.let { remoteBalances ->
                        // 3. Update local cache
                        dao.clearBalances()
                        dao.insertBalances(remoteBalances.map { 
                            BalanceEntity(
                                date = it.date,
                                amount = it.amount,
                                currency = it.currency,
                                status = it.status
                            )
                        })
                    }
                } else {
                    emit(Resource.Error("API Error: ${response.code()}"))
                }
            } catch (e: IOException) {
                emit(Resource.Error("Network Error: Could not reach server."))
            } catch (e: HttpException) {
                emit(Resource.Error("HTTP Error: ${e.message()}"))
            }
        }

        // 4. Emit the final result from the database
        // In a reactive setup, the UI would be observing dao.getAllBalances() directly.
        // Here we just emit the latest state once.
        // In a real implementation, we might use networkBoundResource pattern.
    }
}
