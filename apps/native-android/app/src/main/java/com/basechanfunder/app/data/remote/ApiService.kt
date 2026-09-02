package com.basechanfunder.app.data.remote

import com.basechanfunder.app.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {

    @GET("balances/live/{userId}")
    suspend fun getLiveBalance(
        @Path("userId") userId: String
    ): Response<DailyBalanceDto>

    @POST("adjustments/request")
    suspend fun requestAdjustment(
        @Body request: AdjustmentRequestDto
    ): Response<Unit>

    @GET("adjustments/status/{requestId}")
    suspend fun getAdjustmentStatus(
        @Path("requestId") requestId: String
    ): Response<AdjustmentRequestDto>

    @POST("ingestion/sms-sync")
    suspend fun syncSms(
        @Body payload: SmsPayloadDto
    ): Response<Unit>

    companion object {
        const val BASE_URL = "https://api.basechanfunder.com/v1/"
    }
}
