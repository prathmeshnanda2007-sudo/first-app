package com.messcheck.data.repositories

import com.google.firebase.firestore.FirebaseFirestore
import com.messcheck.data.FirebaseModule
import com.messcheck.data.models.College
import kotlinx.coroutines.tasks.await

class CollegeRepository(private val firestore: FirebaseFirestore = FirebaseModule.firestore) {
    private val collection = firestore.collection("colleges")

    suspend fun getAllColleges(): List<College> {
        val snap = collection.get().await()
        return snap.documents.map { doc ->
            College(
                collegeId = doc.id,
                name = doc.getString("name") ?: "",
                city = doc.getString("city") ?: ""
            )
        }
    }

    suspend fun getCollege(collegeId: String): College? {
        val doc = collection.document(collegeId).get().await()
        if (!doc.exists()) return null
        return College(collegeId = doc.id, name = doc.getString("name") ?: "", city = doc.getString("city") ?: "")
    }

    suspend fun addSampleColleges(samples: List<College>) {
        for (c in samples) {
            collection.document(c.collegeId).set(mapOf("name" to c.name, "city" to c.city)).await()
        }
    }
}
