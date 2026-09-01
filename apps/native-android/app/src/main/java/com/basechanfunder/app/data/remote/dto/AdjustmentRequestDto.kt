package com.basechanfunder.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class AdjustmentRequestDto(
    @SerializedName("userId") val userId: String,
    @SerializedName("amount") val amount: Double,
    @SerializedName("type") val type: String, // e.g., "CREDIT", "DEBIT"
    @SerializedName("reason") val reason: String
)
