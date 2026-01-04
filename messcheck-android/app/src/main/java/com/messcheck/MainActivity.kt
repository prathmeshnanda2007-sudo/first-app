package com.messcheck

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import kotlinx.coroutines.delay
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import kotlinx.coroutines.tasks.await
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.navigation.NavType
import androidx.navigation.NavController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.messcheck.ui.LoginScreen
import com.messcheck.ui.OtpVerificationScreen
import com.messcheck.ui.CollegeSelectionScreen
import com.messcheck.ui.RateMealScreen
import com.messcheck.auth.AuthViewModel
import androidx.lifecycle.viewmodel.compose.viewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MessCheckApp()
        }
    }
}

@Composable
fun MessCheckApp() {
    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
            val navController = rememberNavController()
            val authViewModel: AuthViewModel = viewModel()

            val authState by authViewModel.state.collectAsState()

            // react to success and route user
            LaunchedEffect(authState) {
                when (authState) {
                    is com.messcheck.auth.AuthUiState.Success -> {
                        // check if user has college/mess set
                        val uid = (authState as com.messcheck.auth.AuthUiState.Success).uid
                        val doc = com.messcheck.data.FirebaseModule.firestore.collection("users").document(uid).get().await()
                        val collegeId = doc.getString("collegeId")
                        if (collegeId.isNullOrEmpty()) {
                            navController.navigate("college") {
                                popUpTo("login") { inclusive = true }
                            }
                        } else {
                            navController.navigate("home") {
                                popUpTo("login") { inclusive = true }
                            }
                        }
                    }
                    is com.messcheck.auth.AuthUiState.Error -> {
                        // noop for now
                    }
                    else -> {}
                }
            }

            NavHost(navController = navController, startDestination = "splash") {
                composable("splash") {
                    SimpleSplashScreen(navController)
                }
                composable("login") {
                    LoginScreen(onEmailLogin = { email, pass ->
                        authViewModel.signInEmail(email, pass)
                    }, onPhoneStart = { phone, activity ->
                        authViewModel.startPhoneVerification(phone, activity)
                    })
                }
                composable("otp") {
                    OtpVerificationScreen(onVerify = { code -> authViewModel.verifyOtp(code) })
                }
                composable("college") {
                    val selectionViewModel: com.messcheck.selection.SelectionViewModel = viewModel()
                    CollegeSelectionScreen(onSelected = { collegeId, messId ->
                        // navigate to home when selection is saved
                        navController.navigate("home") {
                            popUpTo("login") { inclusive = true }
                        }
                    }, viewModel = selectionViewModel)
                }
                composable("home") { SimpleHomeScreen(navController) }
                composable("rate/{messId}", arguments = listOf(navArgument("messId") { type = NavType.StringType })) { backStackEntry ->
                    val messId = backStackEntry.arguments?.getString("messId") ?: ""
                    com.messcheck.ui.RateMealScreen(messId = messId, onDone = { navController.popBackStack() })
                }
            }
        }
    }
}

@Composable
fun SimpleHomeScreen(navController: NavController) {
    val uid = com.messcheck.data.FirebaseModule.auth.currentUser?.uid
    var messId by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(uid) {
        if (uid != null) {
            val user = com.messcheck.data.repositories.UserRepository().getUser(uid)
            messId = user?.messId
        }
    }

    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Welcome to MessCheck")
            Spacer(modifier = Modifier.height(12.dp))
            Button(onClick = {
                val mid = messId ?: ""
                navController.navigate("rate/$mid")
            }) { Text("Rate Today's Meal") }
        }
    }
}

@Composable
fun SimpleSplashScreen() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("MessCheck", style = MaterialTheme.typography.headlineLarge)
    }
}

@Composable
fun SimpleSplashScreen(navController: NavController) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("MessCheck", style = MaterialTheme.typography.headlineLarge)
    }
    LaunchedEffect(Unit) {
        delay(1000L)
        navController.navigate("login") {
            popUpTo("splash") { inclusive = true }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun DefaultPreview() {
    MessCheckApp()
}
