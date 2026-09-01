package com.basechanfunder.app.data.remote

import com.basechanfunder.app.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface ApiService {

    @GET("user/profile")
    suspend fun getUserProfile(): Response<UserDto>

    @GET("balances/daily")
    suspend fun getDailyBalances(
        @Query("startDate") startDate: String?,
        @Query("endDate") endDate: String?
    ): Response<List<DailyBalanceDto>>

    @POST("adjustments")
    suspend fun requestAdjustment(
        @Body request: AdjustmentRequestDto
    ): Response<Unit>

    @POST("notifications/sms-sync")
    suspend fun syncSms(
        @Body payload: SmsPayloadDto
    ): Response<Unit>

    companion object {
        const val BASE_URL = "https://api.basechanfunder.com/v1/"
    }
}
