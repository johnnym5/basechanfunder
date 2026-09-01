package com.basechanfunder.app.di

import android.content.Context
import androidx.room.Room
import com.basechanfunder.app.data.local.AppDatabase
import com.basechanfunder.app.data.local.dao.BalanceDao
import com.basechanfunder.app.data.local.dao.TransactionDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "basechanfunder_db"
        ).build()
    }

    @Provides
    @Singleton
    fun provideBalanceDao(db: AppDatabase): BalanceDao = db.balanceDao

    @Provides
    @Singleton
    fun provideTransactionDao(db: AppDatabase): TransactionDao = db.transactionDao
}
