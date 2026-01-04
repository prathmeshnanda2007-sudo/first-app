package com.messcheck.ui

import android.app.Activity
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.messcheck.selection.SelectionViewModel
import com.messcheck.selection.SaveState
import com.messcheck.selection.SelectionUiState
import com.messcheck.data.FirebaseModule
import kotlinx.coroutines.flow.collectLatest
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.LaunchedEffect
import com.messcheck.auth.AuthViewModel
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.TopAppBar

@Composable
fun LoginScreen(onEmailLogin: (String, String) -> Unit, onPhoneStart: (String, Activity) -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    val context = LocalContext.current
    val activity = context as Activity

    Scaffold(topBar = { TopAppBar(title = { Text("Login") }) }) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth().padding(16.dp))
            OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Password") }, modifier = Modifier.fillMaxWidth().padding(16.dp))
            Button(onClick = { onEmailLogin(email, password) }, modifier = Modifier.padding(16.dp)) {
                Text("Sign in with Email")
            }

            Spacer(modifier = Modifier.height(24.dp))

            OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Phone +91...") }, modifier = Modifier.fillMaxWidth().padding(16.dp))
            Button(onClick = { onPhoneStart(phone, activity) }, modifier = Modifier.padding(16.dp)) {
                Text("Send OTP")
            }
        }
    }
}

@Composable
fun OtpVerificationScreen(onVerify: (String) -> Unit) {
    var otp by remember { mutableStateOf("") }
    Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        OutlinedTextField(value = otp, onValueChange = { otp = it }, label = { Text("OTP") }, modifier = Modifier.fillMaxWidth().padding(16.dp))
        Button(onClick = { onVerify(otp) }, modifier = Modifier.padding(16.dp)) { Text("Verify OTP") }
    }
}

@Composable
fun CollegeSelectionScreen(onSelected: (String, String) -> Unit, viewModel: SelectionViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    val saveState by viewModel.saveState.collectAsState()

    LaunchedEffect(saveState) {
        if (saveState is SaveState.Success) {
            val state = viewModel.uiState.value
            if (state is SelectionUiState.Loaded) {
                onSelected(state.selectedCollegeId!!, state.selectedMessId!!)
            } else {
                onSelected("", "")
            }
        }
    }

    when (val s = uiState) {
        is SelectionUiState.Loading -> Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            CircularProgressIndicator()
            Spacer(Modifier.height(8.dp))
            Text("Loading colleges...")
        }
        is SelectionUiState.Empty -> Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text("No colleges found.")
            Spacer(Modifier.height(8.dp))
            Button(onClick = { viewModel.retry() }) { Text("Retry") }
        }
        is SelectionUiState.Error -> Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text("Error: ${s.message}")
            Spacer(Modifier.height(8.dp))
            Button(onClick = { viewModel.retry() }) { Text("Retry") }
        }
        is SelectionUiState.Loaded -> {
            val colleges = s.colleges.map { it.name to it.collegeId }
            val messes = s.messes.map { it.name to it.messId }
            var selectedCollege by remember { mutableStateOf(colleges.firstOrNull()) }
            var selectedMess by remember { mutableStateOf(messes.firstOrNull()) }

            Column(modifier = Modifier.fillMaxSize().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                Text("Select College", style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.height(8.dp))

                DropdownMenuSelector(items = colleges, selected = selectedCollege, onSelect = { college ->
                    selectedCollege = college
                    college?.let { viewModel.selectCollege(it.second) }
                })

                Spacer(Modifier.height(16.dp))
                Text("Select Mess", style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.height(8.dp))

                DropdownMenuSelector(items = messes, selected = selectedMess, onSelect = { mess ->
                    selectedMess = mess
                    mess?.let { viewModel.selectMess(it.second) }
                })

                Spacer(Modifier.height(24.dp))
                when (saveState) {
                    is SaveState.Saving -> Button(onClick = {}, modifier = Modifier.fillMaxWidth()) { Text("Saving...") }
                    else -> Button(onClick = {
                        val uid = FirebaseModule.auth.currentUser?.uid
                        viewModel.saveSelection(uid)
                    }, modifier = Modifier.fillMaxWidth()) { Text("Save and Continue") }
                }
            }
        }
    }
}

@Composable
fun DropdownMenuSelector(items: List<Pair<String, String>>, selected: Pair<String, String>?, onSelect: (Pair<String, String>?) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val label = selected?.first ?: "Select"
    Box(modifier = Modifier.fillMaxWidth()) {
        Button(onClick = { expanded = true }, modifier = Modifier.fillMaxWidth()) { Text(label) }
        androidx.compose.material.DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            items.forEach { item ->
                androidx.compose.material.DropdownMenuItem(onClick = { onSelect(item); expanded = false }) {
                    Text(item.first)
                }
            }
        }
    }
}
