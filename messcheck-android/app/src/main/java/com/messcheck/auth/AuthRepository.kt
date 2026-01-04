package com.messcheck.auth

import android.app.Activity
import com.google.android.gms.tasks.Task
import com.google.firebase.auth.*
import com.google.firebase.auth.ktx.auth
import com.google.firebase.ktx.Firebase
import com.messcheck.data.FirebaseModule
import kotlinx.coroutines.tasks.await

class AuthRepository {
    private val auth: FirebaseAuth = FirebaseModule.auth

    suspend fun signUpWithEmail(email: String, password: String): AuthResult {
        val task = auth.createUserWithEmailAndPassword(email, password)
        return task.await()
    }

    suspend fun signInWithEmail(email: String, password: String): AuthResult {
        val task = auth.signInWithEmailAndPassword(email, password)
        return task.await()
    }

    fun startPhoneNumberVerification(phoneNumber: String, activity: Activity, callbacks: PhoneAuthProvider.OnVerificationStateChangedCallbacks) {
        val options = PhoneAuthOptions.newBuilder(auth)
            .setPhoneNumber(phoneNumber)
            .setTimeout(60L, java.util.concurrent.TimeUnit.SECONDS)
            .setActivity(activity)
            .setCallbacks(callbacks)
            .build()
        PhoneAuthProvider.verifyPhoneNumber(options)
    }

    suspend fun verifyOtp(verificationId: String, code: String): AuthResult {
        val credential = PhoneAuthProvider.getCredential(verificationId, code)
        return auth.signInWithCredential(credential).await()
    }

    fun signOut() {
        auth.signOut()
    }

    fun currentUser() = auth.currentUser
}
