package com.messcheck.storage

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.google.firebase.storage.StorageReference
import com.messcheck.data.FirebaseModule
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.util.*

sealed interface UploadState {
    object Idle : UploadState
    data class Progress(val percent: Int) : UploadState
    data class Success(val downloadUrl: String) : UploadState
    data class Error(val message: String) : UploadState
}

object ImageUploader {
    private val storage = FirebaseModule.storage

    /**
     * Uploads the image located at [uri] after resizing and compressing.
     * Emits progress updates and returns final download URL on success.
     */
    fun uploadImage(context: Context, uri: Uri, userId: String): Flow<UploadState> = callbackFlow {
        try {
            val input = context.contentResolver.openInputStream(uri)
            if (input == null) {
                trySend(UploadState.Error("Unable to open image"))
                close()
                return@callbackFlow
            }

            // decode with bounds to avoid OOM, then scale to max dimension
            val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeStream(input, null, options)
            input.close()

            val maxDim = 1024
            var ratio = 1.0
            val (w, h) = options.outWidth to options.outHeight
            if (w > maxDim || h > maxDim) {
                ratio = if (w > h) w.toDouble() / maxDim else h.toDouble() / maxDim
            }

            val options2 = BitmapFactory.Options()
            options2.inSampleSize = Math.max(1, ratio.toInt())
            val input2 = context.contentResolver.openInputStream(uri)
            val bitmap = BitmapFactory.decodeStream(input2, null, options2)
            input2?.close()

            val baos = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, 80, baos)
            val bytes = baos.toByteArray()

            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val path = "images/$userId/image_$timestamp.jpg"
            val ref: StorageReference = storage.reference.child(path)

            val uploadTask = ref.putBytes(bytes)

            uploadTask.addOnProgressListener { snapshot ->
                val percent = (100.0 * snapshot.bytesTransferred / snapshot.totalByteCount).toInt()
                trySend(UploadState.Progress(percent))
            }.addOnSuccessListener {
                ref.downloadUrl.addOnSuccessListener { uriRes ->
                    trySend(UploadState.Success(uriRes.toString()))
                    close()
                }.addOnFailureListener { exc ->
                    trySend(UploadState.Error(exc.message ?: "Failed to get download url"))
                    close()
                }
            }.addOnFailureListener { exc ->
                trySend(UploadState.Error(exc.message ?: "Upload failed"))
                close()
            }

            awaitClose { uploadTask.cancel() }
        } catch (e: Exception) {
            trySend(UploadState.Error(e.message ?: "Unexpected error"))
            close()
        }
    }
}
