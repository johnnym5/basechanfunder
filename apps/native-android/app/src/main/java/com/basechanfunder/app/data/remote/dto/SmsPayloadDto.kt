package com.basechanfunder.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class SmsPayloadDto(
    @SerializedName("sender") val sender: String,
    @SerializedName("content") val content: String,
    @SerializedName("timestamp") val timestamp: Long,
    @SerializedName("messageId") val messageId: String? = null
)
