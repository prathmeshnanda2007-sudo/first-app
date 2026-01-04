package com.messcheck.data.repositories

import com.google.firebase.firestore.FirebaseFirestore
import com.messcheck.data.FirebaseModule
import com.messcheck.data.models.Complaint
import kotlinx.coroutines.tasks.await

class ComplaintRepository(private val firestore: FirebaseFirestore = FirebaseModule.firestore) {
    private val collection = firestore.collection("complaints")

    suspend fun submitComplaint(complaint: Complaint) {
        val docRef = if (complaint.complaintId.isNotEmpty()) collection.document(complaint.complaintId) else collection.document()
        val data = mapOf(
            "messId" to complaint.messId,
            "userId" to complaint.userId,
            "tags" to complaint.tags,
            "description" to complaint.description,
            "timestamp" to (complaint.timestamp ?: com.google.firebase.Timestamp.now())
        )
        docRef.set(data).await()
    }
}
