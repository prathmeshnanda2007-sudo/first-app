package com.messcheck.rating

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.Timestamp
import com.messcheck.data.models.Rating
import com.messcheck.data.repositories.RatingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import android.content.Context
import android.net.Uri
import com.messcheck.storage.ImageUploader
import com.messcheck.storage.UploadState
import kotlinx.coroutines.flow.collect

sealed interface RatingUiState {
    object Idle : RatingUiState
    object Loading : RatingUiState
    object Success : RatingUiState
    data class Error(val message: String) : RatingUiState
    data class ValidationError(val message: String) : RatingUiState
}

class RatingViewModel(private val repo: RatingRepository = RatingRepository()) : ViewModel() {
    private val _state = MutableStateFlow<RatingUiState>(RatingUiState.Idle)
    val state = _state.asStateFlow()

    private val _uploadState = MutableStateFlow<UploadState>(UploadState.Idle)
    val uploadState = _uploadState.asStateFlow()

    fun submitRating(
        messId: String,
        userId: String,
        mealType: String,
        taste: Int,
        hygiene: Int,
        quantity: Int,
        comment: String?,
        imageUrl: String?
    ) {
        // basic validation
        if (taste !in 1..5 || hygiene !in 1..5 || quantity !in 1..5) {
            _state.value = RatingUiState.ValidationError("Ratings must be between 1 and 5")
            return
        }

        viewModelScope.launch {
            _state.value = RatingUiState.Loading
            try {
                // check if user already rated this meal today
                val already = repo.hasUserRatedToday(userId, mealType)
                if (already) {
                    _state.value = RatingUiState.ValidationError("You have already rated this meal today")
                    return@launch
                }

                val rating = Rating(
                    ratingId = "",
                    messId = messId,
                    userId = userId,
                    mealType = mealType,
                    taste = taste,
                    hygiene = hygiene,
                    quantity = quantity,
                    comment = comment,
                    imageUrl = imageUrl,
                    timestamp = Timestamp.now()
                )

                repo.submitRating(rating)
                _state.value = RatingUiState.Success
            } catch (e: Exception) {
                _state.value = RatingUiState.Error(e.message ?: "Failed to submit rating")
            }
        }
    }

    fun uploadImage(context: Context, uri: Uri) {
        val uid = com.messcheck.data.FirebaseModule.auth.currentUser?.uid ?: run {
            _uploadState.value = UploadState.Error("Not signed in")
            return
        }

        viewModelScope.launch {
            ImageUploader.uploadImage(context, uri, uid).collect { st ->
                _uploadState.value = st
            }
        }
    }
}
