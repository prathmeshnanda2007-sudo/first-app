package com.messcheck.data.repositories

import com.google.firebase.firestore.FirebaseFirestore
import com.messcheck.data.FirebaseModule
import com.messcheck.data.models.Mess
import kotlinx.coroutines.tasks.await

class MessRepository(private val firestore: FirebaseFirestore = FirebaseModule.firestore) {
    private val collection = firestore.collection("messes")

    suspend fun getMessesForCollege(collegeId: String): List<Mess> {
        val snap = collection.whereEqualTo("collegeId", collegeId).get().await()
        return snap.documents.map { doc ->
            Mess(
                messId = doc.id,
                collegeId = doc.getString("collegeId") ?: "",
                name = doc.getString("name") ?: "",
                hygieneScore = doc.getDouble("hygieneScore") ?: 0.0,
                badge = doc.getString("badge") ?: "Red"
            )
        }
    }

    suspend fun addSampleMesses(samples: List<Mess>) {
        for (m in samples) {
            collection.document(m.messId).set(mapOf("collegeId" to m.collegeId, "name" to m.name, "hygieneScore" to m.hygieneScore, "badge" to m.badge)).await()
        }
    }
}
