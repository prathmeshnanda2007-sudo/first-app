package com.messcheck.data.models

import com.google.firebase.Timestamp

data class College(
    val collegeId: String = "",
    val name: String = "",
    val city: String = ""
)

data class Mess(
    val messId: String = "",
    val collegeId: String = "",
    val name: String = "",
    val hygieneScore: Double = 0.0,
    val badge: String = "Red"
)

data class UserProfile(
    val userId: String = "",
    val name: String? = null,
    val role: String = "student",
    val collegeId: String? = null,
    val messId: String? = null,
    val isPremium: Boolean = false
)

data class Rating(
    val ratingId: String = "",
    val messId: String = "",
    val userId: String = "",
    val mealType: String = "",
    val taste: Int = 0,
    val hygiene: Int = 0,
    val quantity: Int = 0,
    val comment: String? = null,
    val imageUrl: String? = null,
    val timestamp: Timestamp? = null
)

data class Complaint(
    val complaintId: String = "",
    val messId: String = "",
    val userId: String = "",
    val tags: List<String> = emptyList(),
    val description: String = "",
    val timestamp: Timestamp? = null
)
