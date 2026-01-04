package com.messcheck.data.repositories

import com.google.firebase.firestore.FirebaseFirestore
import com.messcheck.data.FirebaseModule
import com.messcheck.data.models.UserProfile
import kotlinx.coroutines.tasks.await

class UserRepository(private val firestore: FirebaseFirestore = FirebaseModule.firestore) {
    private val collection = firestore.collection("users")

    suspend fun getUser(uid: String): UserProfile? {
        val doc = collection.document(uid).get().await()
        if (!doc.exists()) return null
        return UserProfile(
            userId = doc.id,
            name = doc.getString("name"),
            role = doc.getString("role") ?: "student",
            collegeId = doc.getString("collegeId"),
            messId = doc.getString("messId"),
            isPremium = doc.getBoolean("isPremium") ?: false
        )
    }

    suspend fun updateCollegeAndMess(uid: String, collegeId: String, messId: String) {
        collection.document(uid).update(mapOf("collegeId" to collegeId, "messId" to messId)).await()
    }

    suspend fun createIfNotExists(profile: UserProfile) {
        val doc = collection.document(profile.userId).get().await()
        if (!doc.exists()) {
            collection.document(profile.userId).set(profile).await()
        }
    }
}
