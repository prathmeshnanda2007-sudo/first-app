package com.messcheck.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.foundation.Image
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import android.net.Uri
import coil.compose.AsyncImage
import com.messcheck.storage.UploadState
import kotlinx.coroutines.flow.collectLatest

import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.messcheck.rating.RatingViewModel
    var imageUrl by remember { mutableStateOf<String?>(null) }
    var imageUri by remember { mutableStateOf<Uri?>(null) }
    val ctx = LocalContext.current

    val galleryLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let { imageUri = it; viewModel.uploadImage(ctx, it) }
    }

    // Camera launcher using TakePicture will need a prepared Uri
    val cameraOutputUri = remember { mutableStateOf<Uri?>(null) }
    val takePictureLauncher = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { success: Boolean ->
        if (success) {
            cameraOutputUri.value?.let { imageUri = it; viewModel.uploadImage(ctx, it) }
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted: Boolean ->
        if (granted) {
            // launch camera after permission granted
            val file = java.io.File.createTempFile("capture_${System.currentTimeMillis()}", ".jpg", ctx.cacheDir)
            val uri = androidx.core.content.FileProvider.getUriForFile(ctx, ctx.packageName + ".fileprovider", file)
            cameraOutputUri.value = uri
            takePictureLauncher.launch(uri)
        } else {
            // Permission denied — could show a Snackbar; for now, no-op
        }
    }

    // Observe upload state
    val uploadState by viewModel.uploadState.collectAsState()
    LaunchedEffect(uploadState) {
        when (uploadState) {
            is UploadState.Success -> imageUrl = (uploadState as UploadState.Success).downloadUrl
            else -> {}
        }
    }
import com.messcheck.data.FirebaseModule
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme

@Composable
fun RateMealScreen(messId: String, onDone: () -> Unit, viewModel: RatingViewModel = viewModel()) {
    var mealType by remember { mutableStateOf("Breakfast") }
    var taste by remember { mutableStateOf(4) }
    var hygiene by remember { mutableStateOf(4) }
    var quantity by remember { mutableStateOf(3) }
    var comment by remember { mutableStateOf("") }
    var imageUrl by remember { mutableStateOf<String?>(null) }

    val state by viewModel.state.collectAsState()

    LaunchedEffect(state) {
        when (state) {
            is RatingUiState.Success -> onDone()
            else -> {}
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Rate Today's Meal", style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(8.dp))
        // Image upload actions
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { galleryLauncher.launch("image/*") }) { Text("Gallery") }
            Button(onClick = {
                // check permission and request if needed
                val permission = android.Manifest.permission.CAMERA
                val granted = androidx.core.content.ContextCompat.checkSelfPermission(ctx, permission) == android.content.pm.PackageManager.PERMISSION_GRANTED
                if (granted) {
                    val file = java.io.File.createTempFile("capture_${System.currentTimeMillis()}", ".jpg", ctx.cacheDir)
                    val uri = androidx.core.content.FileProvider.getUriForFile(ctx, ctx.packageName + ".fileprovider", file)
                    cameraOutputUri.value = uri
                    takePictureLauncher.launch(uri)
                } else {
                    permissionLauncher.launch(permission)
                }
            }) { Text("Camera") }
        }

        Spacer(Modifier.height(8.dp))
        // Preview and upload status
        imageUri?.let { uri ->
            Text("Selected image:")
            AsyncImage(model = uri, contentDescription = "Selected image", modifier = Modifier.fillMaxWidth().height(180.dp))
        }

        when (uploadState) {
            is UploadState.Progress -> Text("Uploading: ${(uploadState as UploadState.Progress).percent}%")
            is UploadState.Error -> Column { Text("Upload error: ${(uploadState as UploadState.Error).message}"); Button(onClick = { imageUri?.let { viewModel.uploadImage(ctx, it) } }) { Text("Retry") } }
            is UploadState.Success -> Text("Image uploaded")
            else -> {}
        }
            listOf("Breakfast", "Lunch", "Dinner").forEach { m ->
                Button(onClick = { mealType = m }, modifier = Modifier.weight(1f)) {
                    Text(m)
                }
            }
        }

        Spacer(Modifier.height(12.dp))
        // Simple numeric selectors
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            NumberSelector(label = "Taste", value = taste, onChange = { taste = it })
            NumberSelector(label = "Hygiene", value = hygiene, onChange = { hygiene = it })
            NumberSelector(label = "Quantity", value = quantity, onChange = { quantity = it })
        }

        Spacer(Modifier.height(12.dp))
        OutlinedTextField(value = comment, onValueChange = { comment = it }, label = { Text("Comment (optional)") }, modifier = Modifier.fillMaxWidth())

        Spacer(Modifier.height(12.dp))
        // Image upload placeholder (image upload wired next)
        Button(onClick = { /* open image picker in next step */ }) { Text("Add Photo (optional)") }

        Spacer(Modifier.height(16.dp))

        when (state) {
            is RatingUiState.Loading -> CircularProgressIndicator()
            is RatingUiState.Error -> Text("Error: ${(state as RatingUiState.Error).message}")
            is RatingUiState.ValidationError -> Text("${(state as RatingUiState.ValidationError).message}")
            else -> {
                val uploading = uploadState is UploadState.Progress
                Button(onClick = {
                    val uid = FirebaseModule.auth.currentUser?.uid ?: return@Button
                    viewModel.submitRating(messId, uid, mealType, taste, hygiene, quantity, if (comment.isBlank()) null else comment, imageUrl)
                }, enabled = !uploading) { Text(if (uploading) "Uploading image..." else "Submit Rating") }
            }
        }
    }
}

@Composable
fun NumberSelector(label: String, value: Int, onChange: (Int) -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Button(onClick = { if (value > 1) onChange(value - 1) }) { Text("-") }
            Spacer(Modifier.width(8.dp))
            Text(value.toString())
            Spacer(Modifier.width(8.dp))
            Button(onClick = { if (value < 5) onChange(value + 1) }) { Text("+") }
        }
    }
}
