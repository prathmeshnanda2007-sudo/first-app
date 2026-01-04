package com.messcheck.data.repositories

import com.google.firebase.firestore.FirebaseFirestore
import com.messcheck.data.FirebaseModule
import com.messcheck.data.models.Rating
import kotlinx.coroutines.tasks.await

class RatingRepository(private val firestore: FirebaseFirestore = FirebaseModule.firestore) {
    private val collection = firestore.collection("ratings")

    suspend fun submitRating(rating: Rating) {
        val docRef = if (rating.ratingId.isNotEmpty()) collection.document(rating.ratingId) else collection.document()
        val data = mapOf(
            "messId" to rating.messId,
            "userId" to rating.userId,
            "mealType" to rating.mealType,
            "taste" to rating.taste,
            "hygiene" to rating.hygiene,
            "quantity" to rating.quantity,
            "comment" to rating.comment,
            "imageUrl" to rating.imageUrl,
            "timestamp" to (rating.timestamp ?: com.google.firebase.Timestamp.now())
        )
        docRef.set(data).await()
    }

    suspend fun getRatingsForMess(messId: String) = collection.whereEqualTo("messId", messId).get().await()

    // Check whether a user has already submitted a rating for a mealType today
    suspend fun hasUserRatedToday(userId: String, mealType: String): Boolean {
        val cal = java.util.Calendar.getInstance()
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0)
        cal.set(java.util.Calendar.MINUTE, 0)
        cal.set(java.util.Calendar.SECOND, 0)
        cal.set(java.util.Calendar.MILLISECOND, 0)
        val start = com.google.firebase.Timestamp(cal.time)
        cal.add(java.util.Calendar.DATE, 1)
        val end = com.google.firebase.Timestamp(cal.time)

        val snap = collection
            .whereEqualTo("userId", userId)
            .whereEqualTo("mealType", mealType)
            .whereGreaterThanOrEqualTo("timestamp", start)
            .whereLessThan("timestamp", end)
            .limit(1)
            .get()
            .await()
        return !snap.isEmpty
    }
}
