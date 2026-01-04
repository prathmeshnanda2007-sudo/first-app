package com.messcheck.auth

import android.app.Activity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.PhoneAuthProvider
import com.google.firebase.auth.ktx.userProfileChangeRequest
import kotlinx.coroutines.tasks.await
import com.messcheck.data.FirebaseModule
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface AuthUiState {
    object Idle : AuthUiState
    object Loading : AuthUiState
    data class Success(val uid: String) : AuthUiState
    data class Error(val message: String) : AuthUiState
}

class AuthViewModel(private val repo: AuthRepository = AuthRepository()) : ViewModel() {
    private val _state = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val state = _state.asStateFlow()

    // hold verificationId temporarily
    var verificationId: String? = null

    fun signUpEmail(email: String, password: String) {
        _state.value = AuthUiState.Loading
        viewModelScope.launch {
            try {
                val res = repo.signUpWithEmail(email, password)
                val uid = res.user?.uid ?: throw Exception("No user")
                ensureUserProfile(uid, email)
                _state.value = AuthUiState.Success(uid)
            } catch (e: Exception) {
                _state.value = AuthUiState.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun signInEmail(email: String, password: String) {
        _state.value = AuthUiState.Loading
        viewModelScope.launch {
            try {
                val res = repo.signInWithEmail(email, password)
                val uid = res.user?.uid ?: throw Exception("No user")
                ensureUserProfile(uid, email)
                _state.value = AuthUiState.Success(uid)
            } catch (e: Exception) {
                _state.value = AuthUiState.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun startPhoneVerification(phone: String, activity: Activity) {
        _state.value = AuthUiState.Loading
        repo.startPhoneNumberVerification(phone, activity, object: PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
            override fun onVerificationCompleted(credential: com.google.firebase.auth.PhoneAuthCredential) {
                // Auto-retrieval
                viewModelScope.launch {
                    try {
                        val res = FirebaseModule.auth.signInWithCredential(credential).await()
                        val uid = res.user?.uid ?: throw Exception("No user")
                        ensureUserProfile(uid, res.user?.phoneNumber)
                        _state.value = AuthUiState.Success(uid)
                    } catch (e: Exception) {
                        _state.value = AuthUiState.Error(e.message ?: "Phone auth failed")
                    }
                }
            }

            override fun onVerificationFailed(e: FirebaseException) {
                _state.value = AuthUiState.Error(e.message ?: "Verification failed")
            }

            override fun onCodeSent(verificationId: String, token: PhoneAuthProvider.ForceResendingToken) {
                this@AuthViewModel.verificationId = verificationId
                _state.value = AuthUiState.Idle
            }
        })
    }

    fun verifyOtp(code: String) {
        val vId = verificationId ?: run {
            _state.value = AuthUiState.Error("No verification id")
            return
        }
        _state.value = AuthUiState.Loading
        viewModelScope.launch {
            try {
                val res = repo.verifyOtp(vId, code)
                val uid = res.user?.uid ?: throw Exception("No user")
                ensureUserProfile(uid, res.user?.phoneNumber)
                _state.value = AuthUiState.Success(uid)
            } catch (e: Exception) {
                _state.value = AuthUiState.Error(e.message ?: "OTP verify failed")
            }
        }
    }

    private suspend fun ensureUserProfile(uid: String, display: String?) {
        val firestore = FirebaseModule.firestore
        val userRef = firestore.collection("users").document(uid)
        val snapshot = userRef.get().await()
        if (!snapshot.exists()) {
            val data = hashMapOf(
                "userId" to uid,
                "name" to (display ?: ""),
                "role" to "student",
                "collegeId" to null,
                "messId" to null
            )
            userRef.set(data).await()
        }
    }

    // helper to refresh user profile from Firestore
    suspend fun getUserProfile(uid: String) = com.messcheck.data.repositories.UserRepository().getUser(uid)
}
