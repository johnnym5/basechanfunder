package com.basechanfunder.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class DailyBalanceDto(
    @SerializedName("date") val date: String,
    @SerializedName("amount") val amount: Double,
    @SerializedName("currency") val currency: String,
    @SerializedName("status") val status: String
)
